# Deploying Payload to Cloudflare Workers with Turso

This project runs on Cloudflare Workers via OpenNext, with SQLite locally and Turso in production. Turso is deliberately chosen over Cloudflare D1 — its free and paid tiers are considerably more generous — which means this is **not** Payload's officially supported Cloudflare path. The arrangement that makes it work is verified by a build step rather than trusted.

## The one thing that can silently break

`@payloadcms/db-sqlite` does `import { createClient } from '@libsql/client'`. That package ships conditional exports:

| Condition | Resolves to | Reaches |
| --- | --- | --- |
| `node` (default) | `lib-esm/node.js` | `sqlite3.js` → `import Database from 'libsql'` — a native `.node` binding **workerd cannot load** |
| `workerd` | `lib-esm/web.js` | fetch only, no native code |

Next bundles with the `node` condition and would bake the wrong entry in before the Cloudflare adapter ever sees the code.

**The fix is not a hand-written alias.** It is telling Next not to bundle the package, so resolution is deferred to the Worker build where `workerd` wins:

```ts
// next.config.ts
serverExternalPackages: ['@libsql/client', '@payloadcms/db-sqlite'],
```

This is the documented OpenNext remedy for any package with `workerd` conditional exports.

**When it breaks, the build still succeeds** and the failure appears only as a runtime error on Cloudflare, after deploy. So it is checked:

```bash
pnpm cf:check   # scripts/check-worker-bundle.mjs — fails on native SQLite in .open-next/
```

`cf:deploy` and `cf:preview` run it automatically. If it ever fails, confirm that `serverExternalPackages` still lists `@libsql/client` and that the package still declares a `workerd` export condition.

## Three more things that had to be worked around

These were found by actually running the build. Each one produces a confusing error a long way from its cause.

### 1. Next's tracer only copies the files it traced

The tracer resolves with the `node` condition, so for a package with conditional exports it copies `node.mjs` and leaves `web.mjs` behind. The Worker bundler then reads `"workerd": "./web.mjs"` from the package.json it *did* copy and fails with **"The module ./web.mjs was not found on the file system"**.

Fixed with `outputFileTracingIncludes` in `next.config.ts`, for `@libsql/isomorphic-ws` and `jose`.

⚠️ The patterns must match **files**, not directories. A trailing `/**` also matches nested directories, and the tracer then tries to read one as a file: **"Is a directory (os error 21)"**.

### 2. Turbopack's tracer cannot handle pnpm's symlinks

With those includes in place, `next build` under Turbopack dies with the same `Is a directory` error, this time on a symlinked package directory. Webpack's tracer handles it.

That is why the `build` script ends in `--webpack`. This is not a preference — the Turbopack path does not produce a deployable build here.

### 3. Payload's `loadEnv` default-imports `@next/env`, which OpenNext shims

`payload/dist/bin/loadEnv.js` does `import nextEnvImport from '@next/env'`. OpenNext replaces `@next/env` with a shim that has only **named** exports, so the build fails with **"No matching export in shims/env.js for import default"**. Nothing in application code imports it; it arrives through Payload's own module graph.

Fixed with a one-line pnpm patch (`patches/payload@3.89.0.patch`, registered in `pnpm-workspace.yaml`):

```js
import * as nextEnvNamespace from '@next/env'
const nextEnvImport = nextEnvNamespace.default ?? nextEnvNamespace
```

The `??` fallback matters. A plain namespace import fixes the Worker and **breaks the Node CLI** — `@next/env` is CJS there, so the namespace puts the module under `.default` and `payload generate:importmap` dies with `loadEnvConfig is not a function`. Both shapes have to be handled.

**Revisit this patch on every Payload upgrade.** If upstream fixes the import, delete it.

## Configuration map

| File | Responsibility |
| --- | --- |
| `wrangler.jsonc` | Worker name, account, compatibility flags, R2 bindings |
| `open-next.config.ts` | Incremental cache backed by R2 |
| `next.config.ts` | `serverExternalPackages`, `initOpenNextCloudflareForDev()` |
| `src/lib/database.ts` | file: vs libsql:// selection, `push` gating |
| `src/lib/logger.ts` | JSON logger for workerd, plus `isWorkersRuntime` |
| `src/lib/storage.ts` | R2 when a bucket is bound, disk otherwise |
| `scripts/check-worker-bundle.mjs` | The guard above |

Required flags: `nodejs_compat` and `global_fetch_strictly_public`, with `compatibility_date` at `2024-12-30` or later.

## Database: one adapter, two destinations

```ts
const url = process.env.DATABASE_URL || 'file:./cafe-caracas.db'
export const isRemoteDatabase = !url.startsWith('file:')

sqliteAdapter({
  client: { url, ...(isRemoteDatabase ? { authToken: process.env.DATABASE_AUTH_TOKEN } : {}) },
  push: !isRemoteDatabase,
})
```

**`push` is gated on the destination, not on `NODE_ENV`.** Drizzle's dev push writes schema changes into the database at runtime — fine against a local file you can delete, dangerous against a shared remote one. Running `pnpm dev` against Turso must not push either, and `NODE_ENV` would not catch that.

With push off, schema reaches Turso only through migrations:

```bash
pnpm payload migrate:create      # local, commit the result
DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… pnpm payload migrate
pnpm cf:deploy
```

Never migrate from inside the Worker.

## What does not work on Workers

| | Why | What we do |
| --- | --- | --- |
| `sharp` | Native binary | Not passed to `buildConfig`. Image resizing is off. |
| `pino-pretty` (default logger) | Worker threads, filesystem streams | JSON logger on `console`, installed only when `isWorkersRuntime` |
| `upload.staticDir` | No writable filesystem | `@payloadcms/storage-r2` when the R2 binding is present |
| Filesystem incremental cache | Same | `r2IncrementalCache` in `open-next.config.ts` |
| GraphQL | Upstream Workers issues; not guaranteed by Payload | Watch `/api/graphql`; disable with `graphQL: { disable: true }` if it breaks |

Runtime detection is `navigator.userAgent === 'Cloudflare-Workers'` — checked against the runtime itself, not inferred from an env var or from the database URL, because running locally against Turso is a real situation that should not change which logger is installed.

## Plan limits, and why they are an architectural concern

| | Free | Paid ($5/mo) |
| --- | --- | --- |
| CPU per request | **10 ms** | 5 min |
| Subrequests per invocation | 50 | 10,000 |
| Requests/day | 100,000 | unlimited |
| Worker size | 64 MiB uncompressed | same |

The 3 MB / 10 MB compressed bundle limits were **removed on 2026-09-04**. Much of the internet — including OpenNext's docs and Payload's own Cloudflare template README — still says otherwise.

The binding constraint is **CPU**. Payload's admin panel renders React on the server and will exceed 10 ms, so the free plan cannot serve `/admin`.

Subrequests are where this meets the architecture: **every Turso query is one HTTP subrequest.** A list view that expands relationships pays per row. That is why `src/modules/catalog` selects explicit fields, caps `depth` at 1 for list queries, keeps join fields out of list selections, and filters categories through `categories.slug` in a single query rather than resolving the slug to an id first.

## Secrets

```bash
wrangler secret put DATABASE_URL
wrangler secret put DATABASE_AUTH_TOKEN
wrangler secret put PAYLOAD_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOKS_SIGNING_SECRET
```

`NEXT_PUBLIC_*` variables are **not** secrets and cannot go in `wrangler.jsonc` `vars` either: Next inlines them into the client bundle during `next build`, so they must be present in the environment that runs the build. Setting one as a var leaves the built bundle holding the old value.

## Deploy runbook

```bash
pnpm generate:types
pnpm lint && pnpm exec vitest run src/modules
pnpm payload migrate              # against Turso
pnpm cf:preview                   # local workerd, real Turso
pnpm cf:deploy
wrangler tail                     # watch for 1101 (exception) / 1102 (CPU)
```

`cf:build` runs `generate:importmap` first; the admin panel will not boot without it.
