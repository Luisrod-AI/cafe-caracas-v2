---
name: payload
description: Use when working with Payload CMS projects (payload.config.ts, collections, fields, hooks, access control, Payload API). Use when debugging validation errors, security issues, relationship queries, transactions, or hook behavior.
---

# Payload CMS Application Development

Payload is a Next.js native CMS with TypeScript-first architecture, providing admin panel, database management, REST/GraphQL APIs, authentication, and file storage.

## Architecture (mandatory)

**Before writing any code that reads or writes data, read [HEXAGONAL.md](reference/HEXAGONAL.md).**

This project separates transactional logic from presentation. Data access lives in per-domain modules under `src/modules/<domain>/`; `src/app/` only renders. The rules are enforced by `no-restricted-imports` zones in `eslint.config.mjs`, so violating them fails the build rather than the review.

The distinction that orders the rest of this skill:

- **Outside the hexagon** — collections, fields, hooks, access control, plugins. Here Payload *is* the external system; you configure it, you do not wrap it. Docs: COLLECTIONS, FIELDS, FIELD-TYPE-GUARDS, HOOKS, ACCESS-CONTROL(-ADVANCED), PLUGIN-DEVELOPMENT.
- **The edge of the hexagon** — queries, endpoints, transports. This code lives only in `infrastructure/repositories/`. Docs: QUERIES, ENDPOINTS, ADAPTERS, ADVANCED.

The three rules broken most often:

1. No `getPayload()` in a page, component or block. Use a repository.
2. `@/payload-types` is importable only inside `infrastructure/dto/`.
3. Map field by field. Never `...dto` — it fails silently.

Worked example: `src/modules/catalog/`.

## Quick Reference

| Task                     | Solution                                  | Details                                                                                                                          |
| ------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Fetch data for a page    | Repository from `@/modules/<d>/server`    | [HEXAGONAL.md#the-six-rules](reference/HEXAGONAL.md#the-six-rules)                                                               |
| Fetch data in the browser| Repository from `@/modules/<d>`           | [HEXAGONAL.md#6-one-port-two-adapters](reference/HEXAGONAL.md#6-one-port-two-adapters)                                           |
| Add a new domain         | Four folders + two barrels                | [HEXAGONAL.md#folder-template](reference/HEXAGONAL.md#folder-template)                                                          |
| Translate CMS → app      | DTO + explicit mapper                     | [HEXAGONAL.md#5-mapping-is-explicit-field-by-field--never-dto](reference/HEXAGONAL.md#5-mapping-is-explicit-field-by-field--never-dto) |
| Typed failures           | Module error kind, `null` for "not found" | [HEXAGONAL.md#errors](reference/HEXAGONAL.md#errors)                                                                            |
| Deploy to Cloudflare     | `pnpm cf:deploy`                          | [CLOUDFLARE-TURSO.md#deploy-runbook](reference/CLOUDFLARE-TURSO.md#deploy-runbook)                                               |
| Local vs Turso database  | `DATABASE_URL` scheme decides             | [CLOUDFLARE-TURSO.md#database-one-adapter-two-destinations](reference/CLOUDFLARE-TURSO.md#database-one-adapter-two-destinations) |
| Auto-generate slugs      | `slugField()`                             | [FIELDS.md#slug-field-helper](reference/FIELDS.md#slug-field-helper)                                                             |
| Restrict content by user | Access control with query                 | [ACCESS-CONTROL.md#row-level-security-with-complex-queries](reference/ACCESS-CONTROL.md#row-level-security-with-complex-queries) |
| Local API user ops       | `user` + `overrideAccess: false`          | [QUERIES.md#access-control-in-local-api](reference/QUERIES.md#access-control-in-local-api)                                       |
| Draft/publish workflow   | `versions: { drafts: true }`              | [COLLECTIONS.md#versioning--drafts](reference/COLLECTIONS.md#versioning--drafts)                                                 |
| Computed fields          | `virtual: true` with afterRead            | [FIELDS.md#virtual-fields](reference/FIELDS.md#virtual-fields)                                                                   |
| Conditional fields       | `admin.condition`                         | [FIELDS.md#conditional-fields](reference/FIELDS.md#conditional-fields)                                                           |
| Custom field validation  | `validate` function                       | [FIELDS.md#validation](reference/FIELDS.md#validation)                                                                           |
| Filter relationship list | `filterOptions` on field                  | [FIELDS.md#relationship](reference/FIELDS.md#relationship)                                                                       |
| Select specific fields   | `select` parameter                        | [QUERIES.md#field-selection](reference/QUERIES.md#field-selection)                                                               |
| Auto-set author/dates    | beforeChange hook                         | [HOOKS.md#collection-hooks](reference/HOOKS.md#collection-hooks)                                                                 |
| Prevent hook loops       | `req.context` check                       | [HOOKS.md#context](reference/HOOKS.md#context)                                                                                   |
| Cascading deletes        | beforeDelete hook                         | [HOOKS.md#collection-hooks](reference/HOOKS.md#collection-hooks)                                                                 |
| Geospatial queries       | `point` field with `near`/`within`        | [FIELDS.md#point-geolocation](reference/FIELDS.md#point-geolocation)                                                             |
| Reverse relationships    | `join` field type                         | [FIELDS.md#join-fields](reference/FIELDS.md#join-fields)                                                                         |
| Next.js revalidation     | Context control in afterChange            | [HOOKS.md#nextjs-revalidation-with-context-control](reference/HOOKS.md#nextjs-revalidation-with-context-control)                 |
| Query by relationship    | Nested property syntax                    | [QUERIES.md#nested-properties](reference/QUERIES.md#nested-properties)                                                           |
| Complex queries          | AND/OR logic                              | [QUERIES.md#andor-logic](reference/QUERIES.md#andor-logic)                                                                       |
| Transactions             | Pass `req` to operations                  | [ADAPTERS.md#threading-req-through-operations](reference/ADAPTERS.md#threading-req-through-operations)                           |
| Background jobs          | Jobs queue with tasks                     | [ADVANCED.md#jobs-queue](reference/ADVANCED.md#jobs-queue)                                                                       |
| Custom API routes        | Collection custom endpoints               | [ADVANCED.md#custom-endpoints](reference/ADVANCED.md#custom-endpoints)                                                           |
| Cloud storage            | Storage adapter plugins                   | [ADAPTERS.md#storage-adapters](reference/ADAPTERS.md#storage-adapters)                                                           |
| Multi-language           | `localization` config + `localized: true` | [ADVANCED.md#localization](reference/ADVANCED.md#localization)                                                                   |
| Create plugin            | `(options) => (config) => Config`         | [PLUGIN-DEVELOPMENT.md#plugin-architecture](reference/PLUGIN-DEVELOPMENT.md#plugin-architecture)                                 |
| Plugin package setup     | Package structure with SWC                | [PLUGIN-DEVELOPMENT.md#plugin-package-structure](reference/PLUGIN-DEVELOPMENT.md#plugin-package-structure)                       |
| Add fields to collection | Map collections, spread fields            | [PLUGIN-DEVELOPMENT.md#adding-fields-to-collections](reference/PLUGIN-DEVELOPMENT.md#adding-fields-to-collections)               |
| Plugin hooks             | Preserve existing hooks in array          | [PLUGIN-DEVELOPMENT.md#adding-hooks](reference/PLUGIN-DEVELOPMENT.md#adding-hooks)                                               |
| Check field type         | Type guard functions                      | [FIELD-TYPE-GUARDS.md](reference/FIELD-TYPE-GUARDS.md)                                                                           |

## Quick Start

```bash
npx create-payload-app@latest my-app
cd my-app
pnpm dev
```

### Minimal Config

This project uses **SQLite via libSQL** — a local file in development, Turso in production. The database and storage wiring is extracted to `src/lib/` so `payload.config.ts` stays readable; see [CLOUDFLARE-TURSO.md](reference/CLOUDFLARE-TURSO.md).

```ts
import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { databaseAdapter } from '@/lib/database'
import { cloudflareLogger, isWorkersRuntime } from '@/lib/logger'
import { storagePlugins } from '@/lib/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Resolved before buildConfig: the R2 binding is only readable asynchronously.
const storage = await storagePlugins()

export default buildConfig({
  admin: { user: 'users' },
  collections: [Users, Pages, Categories, Media],
  db: databaseAdapter,
  editor: lexicalEditor(),
  // pino-pretty cannot start on workerd.
  ...(isWorkersRuntime ? { logger: cloudflareLogger } : {}),
  plugins: [...plugins, ...storage],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // `sharp` is deliberately NOT passed — it is a native binary and cannot run
  // on Cloudflare Workers.
})
```

## Essential Patterns

### Basic Collection

```ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true },
    { name: 'content', type: 'richText' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
```

For more collection patterns (auth, upload, drafts, live preview), see [COLLECTIONS.md](reference/COLLECTIONS.md).

### Common Fields

```ts
// Text field
{ name: 'title', type: 'text', required: true }

// Relationship
{ name: 'author', type: 'relationship', relationTo: 'users', required: true }

// Rich text
{ name: 'content', type: 'richText', required: true }

// Select
{ name: 'status', type: 'select', options: ['draft', 'published'], defaultValue: 'draft' }

// Upload
{ name: 'image', type: 'upload', relationTo: 'media' }
```

For all field types (array, blocks, point, join, virtual, conditional, etc.), see [FIELDS.md](reference/FIELDS.md).

### Hook Example

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

For all hook patterns, see [HOOKS.md](reference/HOOKS.md). For access control, see [ACCESS-CONTROL.md](reference/ACCESS-CONTROL.md).

### Access Control with Type Safety

```ts
import type { Access } from 'payload'
import type { User } from '@/payload-types'

// Type-safe access control
export const adminOnly: Access = ({ req }) => {
  const user = req.user as User
  return user?.roles?.includes('admin') || false
}

// Row-level access control
export const ownPostsOnly: Access = ({ req }) => {
  const user = req.user as User
  if (!user) return false
  if (user.roles?.includes('admin')) return true

  return {
    author: { equals: user.id },
  }
}
```

### Query Example

```ts
// Local API
const posts = await payload.find({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
    'author.name': { contains: 'john' },
  },
  depth: 2,
  limit: 10,
  sort: '-createdAt',
})

// Query with populated relationships
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 2, // Populates relationships (default is 2)
})
// Returns: { author: { id: "user123", name: "John" } }

// Without depth, relationships return IDs only
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 0,
})
// Returns: { author: "user123" }
```

For all query operators and REST/GraphQL examples, see [QUERIES.md](reference/QUERIES.md).

### Getting Payload Instance

`getPayload()` belongs in **one** place: a repository under `src/modules/<domain>/infrastructure/repositories/`. ESLint rejects it anywhere in `src/app/`, `src/components/` or `src/blocks/`.

```ts
// src/modules/blog/infrastructure/repositories/PayloadLocalPostRepository.ts
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export class PayloadLocalPostRepository implements IPostRepository {
  async list(query: PostQuery): Promise<PostPage> {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      select: buildPostSelect(),
      overrideAccess: false, // let the CMS decide what is visible
      where: buildPostWhere(query),
    })

    return toPostPage(result) // domain types leave, never CMS documents
  }
}
```

```tsx
// src/app/(app)/blog/page.tsx — the page asks, it does not query
import { getPostRepository } from '@/modules/blog/server'

export default async function Page() {
  const posts = await getPostRepository().list({})

  return <div>{posts.results.map((post) => <h1 key={post.id}>{post.title}</h1>)}</div>
}
```

Why the page cannot just call `payload.find()`: the query, its field selection and its access rules would live inside a component, where no other surface can reuse or verify them. That is how two pages end up disagreeing about what "a published post" means.

See [HEXAGONAL.md](reference/HEXAGONAL.md).

## Security Pitfalls

### 1. Local API Access Control (CRITICAL)

**By default, Local API operations bypass ALL access control**, even when passing a user.

```ts
// ❌ SECURITY BUG: Passes user but ignores their permissions
await payload.find({
  collection: 'posts',
  user: someUser, // Access control is BYPASSED!
})

// ✅ SECURE: Actually enforces the user's permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED for access control
})
```

**When to use each:**

- `overrideAccess: true` (default) - Server-side operations you trust (cron jobs, system tasks)
- `overrideAccess: false` - When operating on behalf of a user (API routes, webhooks)

See [QUERIES.md#access-control-in-local-api](reference/QUERIES.md#access-control-in-local-api).

### 2. Transaction Failures in Hooks

**Nested operations in hooks without `req` break transaction atomicity.**

```ts
// ❌ DATA CORRUPTION RISK: Separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req - runs in separate transaction!
      })
    },
  ]
}

// ✅ ATOMIC: Same transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Maintains atomicity
      })
    },
  ]
}
```

See [ADAPTERS.md#threading-req-through-operations](reference/ADAPTERS.md#threading-req-through-operations).

### 3. Infinite Hook Loops

**Hooks triggering operations that trigger the same hooks create infinite loops.**

```ts
// ❌ INFINITE LOOP
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        req,
      }) // Triggers afterChange again!
    },
  ]
}

// ✅ SAFE: Use context flag
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipHooks) return

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        context: { skipHooks: true },
        req,
      })
    },
  ]
}
```

See [HOOKS.md#context](reference/HOOKS.md#context).

## Project Structure

Two halves. The CMS configuration is the external system; the modules are the application.

```txt
src/
├── app/                      # PRESENTATION ONLY — renders domain entities
│   ├── (app)/                #   storefront
│   └── (payload)/            #   the CMS's own mount point
├── components/               # PRESENTATION — takes domain types as props
├── blocks/                   # PRESENTATION
│
├── modules/                  # ── THE HEXAGON ──────────────────────────────
│   └── catalog/
│       ├── domain/
│       │   ├── entities/     #   shapes the app speaks (no CMS imports)
│       │   ├── repositories/ #   ports
│       │   └── errors/
│       ├── application/      #   use cases, when there is orchestration
│       ├── infrastructure/
│       │   ├── dto/          #   the ONLY place @/payload-types may appear
│       │   ├── mappers/      #   explicit, field by field
│       │   └── repositories/ #   the ONLY place getPayload/fetch may appear
│       ├── index.ts          #   public barrel — safe anywhere
│       └── server.ts         #   server barrel — 'server-only'
│
├── collections/              # ── OUTSIDE THE HEXAGON: the CMS itself ──────
├── access/
├── globals/
├── plugins/
├── lib/                      # database / logger / storage wiring
└── payload.config.ts
```

## Type Generation

```ts
// payload.config.ts
export default buildConfig({
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // ...
})

// Usage
import type { Post, User } from '@/payload-types'
```

## Common Gotchas

1. **Local API bypasses access control** unless you pass `overrideAccess: false`
2. **Missing `req` in nested operations** breaks transaction atomicity
3. **Hook loops** — operations in hooks can re-trigger the same hooks; use `req.context` flags
4. **Field-level access** returns boolean only, no query constraints
5. **Relationship depth** defaults to 2; set `depth: 0` for IDs only
6. **Draft status** — `_status` field is auto-injected when drafts are enabled
7. **Types are stale** until you run `generate:types`
8. **MongoDB transactions** require replica set configuration
9. **SQLite transactions** are disabled by default; enable with `transactionOptions: {}`
10. **Point fields** are not supported in SQLite
11. **A spread in a mapper** (`...dto`) fails silently — the view reads `undefined` and nothing throws
12. **`getPayload()` outside a repository** fails lint, not review
13. **Exporting a Local adapter from the shared barrel** ships the whole CMS config to the browser; use `server.ts`
14. **`push: true` against Turso** writes schema at runtime; it is gated on the URL scheme, not on `NODE_ENV`

## Best Practices

### Security

- Default to restrictive access, gradually add permissions
- Use `overrideAccess: false` when passing `user` to Local API
- Field-level access only returns boolean (no query constraints)
- Never trust client-provided data
- Use `saveToJWT: true` for roles to avoid database lookups

### Performance

- Index frequently queried fields
- Use `select` to limit returned fields
- Set `maxDepth` on relationships to prevent over-fetching
- Prefer query constraints over async operations in access control
- Cache expensive operations in `req.context`

### Data Integrity

- Always pass `req` to nested operations in hooks
- Use context flags to prevent infinite hook loops
- Enable transactions for MongoDB (requires replica set) and Postgres
- Use `beforeValidate` for data formatting
- Use `beforeChange` for business logic

### Type Safety

- Run `generate:types` after schema changes
- Import types from generated `payload-types.ts`
- Type your user object: `import type { User } from '@/payload-types'`
- Use `as const` for field options
- Use field type guards for runtime type checking

### Organization

The layer contract, in full — see [HEXAGONAL.md](reference/HEXAGONAL.md) for the reasoning:

1. `domain/` imports nothing — no CMS, no React, no Next
2. `@/payload-types` only inside `infrastructure/dto/`
3. `getPayload()` / `fetch('/api/…')` only inside `infrastructure/repositories/`
4. Presentation imports the module barrel, never its internals
5. Mapping is explicit field by field, never `...dto`
6. One port, two adapters — and two barrels, because `server.ts` would otherwise ship the whole CMS config to the browser

For the CMS side (outside the hexagon):

- Keep collections in separate files
- Extract access control to `access/` directory
- Extract hooks to `hooks/` directory
- Use reusable field factories for common patterns
- Document complex access control with comments

## Reference Documentation

### Architecture — read first

- **[HEXAGONAL.md](reference/HEXAGONAL.md)** - The layer contract, folder template, ports and adapters, enforcement. Mandatory before writing data access.
- **[CLOUDFLARE-TURSO.md](reference/CLOUDFLARE-TURSO.md)** - Workers deployment, the libSQL resolution trap, migrations, plan limits.

### The edge of the hexagon — code that talks to the CMS

- **[QUERIES.md](reference/QUERIES.md)** - Query operators, Local vs REST as two adapters of one port
- **[ENDPOINTS.md](reference/ENDPOINTS.md)** - Custom endpoints as server-side ports
- **[ADAPTERS.md](reference/ADAPTERS.md)** - Payload's db/storage/email adapters (*not* the hexagon's adapters), transactions
- **[ADVANCED.md](reference/ADVANCED.md)** - Auth, jobs, localization, custom components

### Outside the hexagon — configuring the CMS

- **[FIELDS.md](reference/FIELDS.md)** - All field types, validation, admin options
- **[FIELD-TYPE-GUARDS.md](reference/FIELD-TYPE-GUARDS.md)** - Type guards for runtime field type checking and narrowing
- **[COLLECTIONS.md](reference/COLLECTIONS.md)** - Collection configs, auth, upload, drafts, live preview
- **[HOOKS.md](reference/HOOKS.md)** - Collection hooks, field hooks, context patterns
- **[ACCESS-CONTROL.md](reference/ACCESS-CONTROL.md)** - Collection, field, global access control, RBAC, multi-tenant
- **[ACCESS-CONTROL-ADVANCED.md](reference/ACCESS-CONTROL-ADVANCED.md)** - Context-aware, time-based, subscription-based access, factory functions, templates
- **[QUERIES.md](reference/QUERIES.md)** - Query operators, Local/REST/GraphQL APIs
- **[ENDPOINTS.md](reference/ENDPOINTS.md)** - Custom API endpoints: authentication, helpers, request/response patterns
- **[ADAPTERS.md](reference/ADAPTERS.md)** - Database, storage, email adapters, transactions
- **[ADVANCED.md](reference/ADVANCED.md)** - Authentication, jobs, endpoints, components, plugins, localization
- **[PLUGIN-DEVELOPMENT.md](reference/PLUGIN-DEVELOPMENT.md)** - Plugin architecture, monorepo structure, patterns, best practices

## Resources

- llms-full.txt: <https://payloadcms.com/llms-full.txt>
- Docs: <https://payloadcms.com/docs>
- GitHub: <https://github.com/payloadcms/payload>
- Examples: <https://github.com/payloadcms/payload/tree/3.x/examples>
- Templates: <https://github.com/payloadcms/payload/tree/3.x/templates>
