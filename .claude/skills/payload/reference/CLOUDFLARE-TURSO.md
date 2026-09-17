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

## Two failures that look like Cloudflare and are not

Both of these were diagnosed against a live deployment. Both reproduce locally with `pnpm build && npx next start`, which is the cheapest way to tell "broken on Workers" apart from "broken in the production build".

### `NEXT_PUBLIC_*` cannot be set at runtime — ever

Symptom: requests to `http://localhost:3000/api/...` from the deployed site, failing with `ERR_CONNECTION_REFUSED`, while *other* requests to the same endpoint succeed.

Cause: `next build` **inlines** every `NEXT_PUBLIC_*` value into the JavaScript. Setting one in `wrangler.jsonc` `vars`, or as a Worker secret, does nothing — the bundle already holds whatever was present at build time. `src/providers/Auth/index.tsx` builds absolute URLs from `process.env.NEXT_PUBLIC_SERVER_URL`, so it froze `http://localhost:3000`.

Why some calls still worked: the ecommerce plugin issues **relative** URLs (`/api/users/me?...`), which resolve against whatever origin the page is on. Same endpoint, two callers, one hardcoding a base and one not.

Fix: supply it to the build.

```bash
NEXT_PUBLIC_SERVER_URL="https://<worker>.workers.dev" pnpm cf:deploy
```

Verify it took, rather than assuming:

```bash
rg -l "localhost:3000" .open-next/assets/_next/static/chunks/   # must print nothing
```

The durable fix is architectural: a repository should take a base URL through its constructor and default to a **relative** one. Absolute URLs built from env vars inside components are the un-migrated transactional logic described in [HEXAGONAL.md](HEXAGONAL.md).

### A duplicated `@payloadcms/ui` blanks the admin panel

Symptom: every admin route renders a blank page, or "This page couldn't load". No server error, no failed request, nothing in `wrangler tail`. `curl` shows HTTP 200 and an empty `<body>`. The browser console shows:

```txt
useUploadHandlers must be used within UploadHandlersProvider
```

That message is misleading. `UploadHandlersProvider` **is** mounted — unconditionally, inside `RootProvider` — and custom providers render as its children. The real cause is that the provider and the consumer came from **two different physical copies** of `@payloadcms/ui`:

```txt
@payloadcms/next                        -> @payloadcms/ui@...14ecdbd5   CREATES the context
@payloadcms/plugin-cloud-storage/client -> @payloadcms/ui@...88c1019b   READS the context
```

Two module instances mean two distinct React context objects, so the consumer never sees the provider's value. pnpm creates one physical copy per distinct peer-dependency resolution, and this project had **four** copies of `@payloadcms/ui`.

Fix: `nodeLinker: hoisted` in `pnpm-workspace.yaml` — a flat, npm-style `node_modules` with one copy of each package. `pnpm dedupe` does **not** fix it; the copies are legitimate peer variants, not accidental duplicates.

This is not specific to R2. Any package that shares a React context across a plugin boundary can hit it.

**Diagnostic lesson:** this failure is invisible to `curl` — the HTML is a normal 200 and the admin is client-rendered. Check admin changes in a real browser and read the console.

### Do not use a missing endpoint as proof that R2 is off

`POST /api/storage-r2-multi-part-upload` returning 404 looks like "the plugin is disabled". It is not: `initClientUploads` registers that endpoint **only when `clientUploads` is configured**, independently of whether the adapter is active.

With `clientUploads: true` the endpoint exists and answers `403` to an unauthenticated request, which *is* a usable signal:

| Response | Meaning |
| --- | --- |
| `403 You are not allowed…` | Plugin active, endpoint registered |
| `404 Route not found` | Either the adapter is off **or** `clientUploads` is not set |

### Reading the binding: ask the runtime, not `NODE_ENV`

`getCloudflareContext()` only resolves inside workerd. Everywhere else — `next build`, `next dev`, the `payload` CLI — bindings come from Wrangler's platform proxy.

Do not branch on `NODE_ENV`: it is `production` during `next build` too, so keying on it sends the build down the Worker-only path, where the context resolves to nothing. Branch on the runtime itself:

```ts
const { env } = isWorkersRuntime
  ? await getCloudflareContext({ async: true })
  : await getContextFromWrangler()   // getPlatformProxy, remoteBindings: true
```

Then split the two concerns, which is what gives the same local/production behaviour the database has:

- **Registration** is static — the plugin is always in the array, because `generate:importmap` reads that list and a conditionally-registered plugin is missing from the map in exactly the environment that needs it.
- **Activation** is `isWorkersRuntime && Boolean(bucket)`. The bucket check alone is not enough: the proxy hands the build and the CLI the *real* bucket on purpose, so without the runtime check `pnpm dev` writes into the production bucket.

Verified end to end: `404` on the upload endpoint locally (disk), `403` in production (R2 active).

### Registering plugins conditionally is its own trap

Even setting the bug above aside, do not build the plugin list dynamically.

`payload generate:importmap` discovers admin components by walking the config at **build** time, and the map it writes is the only way the admin resolves a component at **runtime**. A plugin that registers only when a binding exists is absent when you generate the map locally and present in production, which yields:

```txt
getFromImportMap: PayloadComponent not found in importMap
```

Registration should be static; activation is what varies.

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
  push: false,
})
```

**`push` is off everywhere, including local development.** Drizzle's dev push runs on every `getPayload()` connect: it introspects the database, diffs against the config and applies the difference. That works on a database push itself created, and collides with one built by migrations — it does not recognise the indexes the migrations already made, reissues them, and the connection dies with `index ... already exists`.

The two cannot share a database. Keeping push for local and migrations for production is also precisely what makes the two schemas diverge, and the divergence only surfaces on deploy.

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
