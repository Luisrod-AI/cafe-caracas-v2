# Payload CMS Querying Reference

Complete reference for querying data across Local API, REST, and GraphQL.

> **Where this code lives: `src/modules/<domain>/infrastructure/repositories/` — nowhere else.**
>
> Everything in this document is *edge of the hexagon* code. A query in a page or component puts its field selection and its access rules somewhere no other surface can reuse or verify. ESLint rejects `getPayload` in `src/app/`, `src/components/` and `src/blocks/`.
>
> A query never returns what it fetched. It returns domain entities, through a mapper. See [HEXAGONAL.md](HEXAGONAL.md).

## Local API and REST are two adapters of one port

Payload exposes the same data twice. Which one is correct depends on **where the code runs**, not on what it wants — so both implement the same interface and the caller picks neither.

| | Local API | REST API |
| --- | --- | --- |
| Entry | `getPayload({ config })` | `fetch('/api/…')` |
| Runs in | Server components, route handlers | Browser, and anywhere |
| Cost | In process, no HTTP hop | One request — on Cloudflare Workers, one **subrequest** |
| Access control | Bypassed by default — **must** pass `overrideAccess: false` | Enforced by the server |
| Bundle impact | Pulls the entire Payload config | None |

```ts
// domain/repositories/IProductRepository.ts — the port
export interface IProductRepository {
  list(query: ProductQuery): Promise<ProductPage>
}

// infrastructure/repositories/PayloadLocalProductRepository.ts
// infrastructure/repositories/PayloadRestProductRepository.ts
```

Because the bundle impact is asymmetric, the two are exposed through **separate barrels** — `@/modules/<d>/server` and `@/modules/<d>` — not one function with a `typeof window` branch. A runtime branch keeps the server adapter in the client bundle, because the bundler cannot prove it is dead.

Share the query translation between them. Duplicating a `where` builder is the fastest way to make the server-rendered grid and a client-side refetch disagree about what "the same page" means. Worked example: `src/modules/catalog/infrastructure/repositories/productQuery.ts`.

## Query Operators

```ts
import type { Where } from 'payload'

// Equals
const equalsQuery: Where = { color: { equals: 'blue' } }

// Not equals
const notEqualsQuery: Where = { status: { not_equals: 'draft' } }

// Greater/less than
const greaterThanQuery: Where = { price: { greater_than: 100 } }
const lessThanEqualQuery: Where = { age: { less_than_equal: 65 } }

// Contains (case-insensitive)
const containsQuery: Where = { title: { contains: 'payload' } }

// Like (all words present)
const likeQuery: Where = { description: { like: 'cms headless' } }

// In/not in
const inQuery: Where = { category: { in: ['tech', 'news'] } }

// Exists
const existsQuery: Where = { image: { exists: true } }

// Near (point fields)
const nearQuery: Where = { location: { near: '-122.4194,37.7749,10000' } }
```

## AND/OR Logic

```ts
import type { Where } from 'payload'

const complexQuery: Where = {
  or: [
    { color: { equals: 'mint' } },
    {
      and: [{ color: { equals: 'white' } }, { featured: { equals: false } }],
    },
  ],
}
```

## Nested Properties

```ts
import type { Where } from 'payload'

const nestedQuery: Where = {
  'author.role': { equals: 'editor' },
  'meta.featured': { exists: true },
}
```

## Local API

```ts
// Find documents
const posts = await payload.find({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
    'author.name': { contains: 'john' },
  },
  depth: 2,
  limit: 10,
  page: 1,
  sort: '-createdAt',
  locale: 'en',
  select: {
    title: true,
    author: true,
  },
})

// Find by ID
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 2,
})

// Create
const post = await payload.create({
  collection: 'posts',
  data: {
    title: 'New Post',
    status: 'draft',
  },
})

// Update
await payload.update({
  collection: 'posts',
  id: '123',
  data: {
    status: 'published',
  },
})

// Delete
await payload.delete({
  collection: 'posts',
  id: '123',
})

// Count
const count = await payload.count({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
  },
})
```

### Threading req Parameter

When performing operations in hooks or nested operations, pass the `req` parameter to maintain transaction context:

```ts
// ✅ CORRECT: Pass req for transaction safety
const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await req.payload.create({
    collection: 'audit-log',
    data: { action: 'created', docId: doc.id },
    req, // Maintains transaction atomicity
  })
}

// ❌ WRONG: Missing req breaks transaction
const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await req.payload.create({
    collection: 'audit-log',
    data: { action: 'created', docId: doc.id },
    // Missing req - runs in separate transaction
  })
}
```

This is critical for MongoDB replica sets and Postgres. See [ADAPTERS.md#threading-req-through-operations](ADAPTERS.md#threading-req-through-operations) for details.

### Access Control in Local API

**Important**: Local API bypasses access control by default (`overrideAccess: true`). When passing a `user` parameter, you must explicitly set `overrideAccess: false` to respect that user's permissions.

```ts
// ❌ WRONG: User is passed but access control is bypassed
const posts = await payload.find({
  collection: 'posts',
  user: currentUser,
  // Missing: overrideAccess: false
  // Result: Operation runs with ADMIN privileges, ignoring user's permissions
})

// ✅ CORRECT: Respects user's access control permissions
const posts = await payload.find({
  collection: 'posts',
  user: currentUser,
  overrideAccess: false, // Required to enforce access control
  // Result: User only sees posts they have permission to read
})

// Administrative operation (intentionally bypass access control)
const allPosts = await payload.find({
  collection: 'posts',
  // No user parameter
  // overrideAccess defaults to true
  // Result: Returns all posts regardless of access control
})
```

**When to use `overrideAccess: false`:**

- Performing operations on behalf of a user
- Testing access control logic
- API routes that should respect user permissions
- Any operation where `user` parameter is provided

**When `overrideAccess: true` is appropriate:**

- Administrative operations (migrations, seeds, cron jobs)
- Internal system operations
- Operations explicitly intended to bypass access control

See [ACCESS-CONTROL.md#important-notes](ACCESS-CONTROL.md#important-notes) for more details.

## REST API

```ts
import { stringify } from 'qs-esm'

const query = {
  status: { equals: 'published' },
}

const queryString = stringify(
  {
    where: query,
    depth: 2,
    limit: 10,
  },
  { addQueryPrefix: true },
)

const response = await fetch(`https://api.example.com/api/posts${queryString}`)
const data = await response.json()
```

### REST Endpoints

```txt
GET    /api/{collection}           - Find documents
GET    /api/{collection}/{id}      - Find by ID
POST   /api/{collection}           - Create
PATCH  /api/{collection}/{id}      - Update
DELETE /api/{collection}/{id}      - Delete
GET    /api/{collection}/count     - Count documents

GET    /api/globals/{slug}         - Get global
POST   /api/globals/{slug}         - Update global
```

## GraphQL

```graphql
query {
  Posts(where: { status: { equals: published } }, limit: 10, sort: "-createdAt") {
    docs {
      id
      title
      author {
        name
      }
    }
    totalDocs
    hasNextPage
  }
}

mutation {
  createPost(data: { title: "New Post", status: draft }) {
    id
    title
  }
}

mutation {
  updatePost(id: "123", data: { status: published }) {
    id
    status
  }
}

mutation {
  deletePost(id: "123") {
    id
  }
}
```

## Performance Best Practices

- Set `maxDepth` on relationships to prevent over-fetching
- Use `select` to limit returned fields
- Index frequently queried fields
- Use `virtual` fields for computed data
- Cache expensive operations in hook `context`

### On Cloudflare Workers this is not just performance

**Every database query is one HTTP subrequest** when the database is Turso. The per-invocation budget is 50 on the free plan and 10,000 on paid, and a list view that expands relationships pays per row.

That turns three habits into requirements, and `src/modules/catalog` follows all three:

- **Cap `depth` deliberately.** `depth: 1` expands the gallery image and categories the grid renders. `depth: 2` would additionally expand each category's own relationships — data no view reads, paid for on every row.
- **Keep join fields out of list selections.** Selecting a join field costs one extra query *per row*.
- **Query through the relationship instead of resolving it first.** `{ 'categories.slug': { equals: slug } }` is one round trip; fetching the category to get its id and then filtering by id is two.

See [CLOUDFLARE-TURSO.md](CLOUDFLARE-TURSO.md).
