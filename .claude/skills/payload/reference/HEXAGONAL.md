# Hexagonal Architecture in a Payload Project

**Read this before writing any code that reads or writes data.** Every other document in this skill assumes the layering defined here.

## The distinction that orders everything

Payload is two things at once, and treating them as one is the mistake this architecture exists to prevent.

| | What it is | Where it lives | Skill docs |
| --- | --- | --- | --- |
| **Outside the hexagon** | Payload *is* the external system. Collections, fields, hooks, access control and plugins configure the backend the application talks *to*. | `src/collections/`, `src/access/`, `src/plugins/`, `payload.config.ts` | COLLECTIONS, FIELDS, FIELD-TYPE-GUARDS, HOOKS, ACCESS-CONTROL, ACCESS-CONTROL-ADVANCED, PLUGIN-DEVELOPMENT |
| **The edge of the hexagon** | The code that *talks* to that system. Queries, transports, endpoints. | `src/modules/*/infrastructure/` | QUERIES, ENDPOINTS, ADAPTERS, ADVANCED |
| **Inside the hexagon** | The application's own vocabulary and rules. Knows nothing about Payload. | `src/modules/*/domain/`, `src/modules/*/application/` | this document |
| **Presentation** | React. Renders domain entities. | `src/app/`, `src/components/`, `src/blocks/` | this document |

You do not wrap collections in ports. You wrap **access to** collections in ports.

## Folder template

```txt
src/modules/<domain>/
├── domain/
│   ├── entities/          # The shapes the application speaks
│   ├── repositories/      # Ports — interfaces only
│   └── errors/            # Typed failures
├── application/           # Use cases (only when there is real orchestration)
├── infrastructure/
│   ├── dto/               # What Payload actually returns
│   ├── mappers/           # DTO → domain, domain → CMS input
│   └── repositories/      # PayloadLocal*, PayloadRest*
├── index.ts               # Public barrel — safe anywhere
└── server.ts              # Server barrel — re-exports index + server adapters
```

Worked example in this repo: `src/modules/catalog/`.

## The six rules

### 1. `domain/` imports nothing

No `payload`, no `@/payload-types`, no `react`, no `next`, no `@payloadcms/*`.

If a domain type needs the CMS to compile, the domain is modelling the database instead of the business. That is the failure this rule catches early.

```ts
// ✅ domain/entities/Product.ts
export interface ProductListItem {
  id: string
  title: string
  priceInUSD: number | null
}

// ❌ domain/entities/Product.ts
import type { Product } from '@/payload-types'
export type ProductListItem = Pick<Product, 'id' | 'title' | 'priceInUSD'>
```

The second one compiles and looks tidy. It also means every schema change is a domain change, and `id` is whatever the database decided it is.

### 2. `@/payload-types` is importable only inside `infrastructure/dto/`

The generated types are the **wire contract**. They belong in one file per module so that a schema change surfaces as a type error in a known place instead of as `undefined` in a component.

### 3. Only `infrastructure/repositories/` may call `getPayload()` or `fetch('/api/…')`

Not a page, not a component, not a hook.

A `payload.find()` inside a page component puts the query, its field selection and its access rules somewhere no other surface can reuse or verify. That is how two pages end up disagreeing about what "a published product" means.

### 4. Presentation imports the barrel, never the internals

```ts
// ✅
import { getProductRepository } from '@/modules/catalog/server'
import type { ProductListItem } from '@/modules/catalog'

// ❌
import { PayloadLocalProductRepository } from '@/modules/catalog/infrastructure/repositories/PayloadLocalProductRepository'
```

Deep imports make every internal file a public API, and then nothing inside the module can be renamed.

### 5. Mapping is explicit, field by field — never `...dto`

```ts
// ✅
return {
  id: String(dto.id),
  title: dto.title,
  priceInUSD: toDisplayPrice(dto),
}

// ❌
return { ...dto, id: String(dto.id) }
```

The spread is worse than wrong — it fails **silently**. `_status`, `enableVariants` and the whole variant tree reach the view under database names, `item.someField` reads `undefined`, the grid renders without a price, and nothing throws.

### 6. One port, two adapters

Payload exposes the same data two ways, and which one is correct depends on *where the code runs*, not on what it wants.

| | Local API | REST API |
| --- | --- | --- |
| Import | `getPayload({ config })` | `fetch('/api/…')` |
| Runs in | Server components, route handlers | Browser, and anywhere |
| Cost | In-process, no HTTP hop | One request — on Workers, one **subrequest** |
| Access control | **Must** pass `overrideAccess: false` | Enforced by the server |

Both implement the same port. Neither name appears outside `infrastructure/`.

```ts
// domain/repositories/IProductRepository.ts
export interface IProductRepository {
  list(query: ProductQuery): Promise<ProductPage>
  getBySlug(slug: string): Promise<ProductListItem | null>
}
```

## Two barrels, and why it is not optional

`index.ts` must **not** export the Local adapter.

`PayloadLocalProductRepository` imports `@payload-config`, which transitively pulls every collection, every plugin and the database adapter into whatever bundle touches it. One client component importing the shared barrel drags all of that into the browser.

- `index.ts` — domain types, errors, the REST adapter. Safe anywhere.
- `server.ts` — `import 'server-only'`, re-exports `./index`, plus the Local adapter and `getProductRepository()`.

`import 'server-only'` turns the rule into a build error with a clear message, instead of a silent 3 MB regression.

Likewise, expose the two repositories through **separate functions**, not one function with a `typeof window` branch. A runtime branch keeps the server adapter in the client bundle because the bundler cannot prove it is dead.

## Errors

Every failure leaving a module wears the module's error type. Without it the caller has to guess: a dropped connection, a 403 and a changed response shape arrive as three different exception types from three different layers, and the page catches `unknown` and renders the same blank state for all three.

```ts
export const CATALOG_ERROR_KIND = {
  UNREACHABLE: 'unreachable',  // no answer — network, timeout, worker limit
  FORBIDDEN: 'forbidden',      // answered, denied
  CONTRACT: 'contract',        // answered, wrong shape
  UNKNOWN: 'unknown',
} as const
```

`null` is not an error. "No product at this slug" is an ordinary outcome the page turns into a 404 — return `null`, do not throw.

## Enforcement

These rules are in `eslint.config.mjs` as `no-restricted-imports` zones, because a convention is something the next person under deadline pressure works around in one line.

- **Zone 1** — `src/modules/*/domain/**` cannot import the CMS or a framework, or reach into `infrastructure/`.
- **Zone 2** — `src/modules/*/infrastructure/**` (except `dto/`) cannot import `@/payload-types`.
- **Zone 3** — `src/app/`, `src/components/`, `src/blocks/` cannot import `getPayload`, nor reach into module internals.

Zone 3 carries a `UNMIGRATED_CMS_CALLERS` list. That is a **ratchet, not an amnesty**: the rule is an `error` so no new file can join, and deleting an entry is how a migration is marked done. The list only shrinks.

Verify the boundary actually bites:

```bash
# Add `import type { Product } from '@/payload-types'` to a domain file, then:
pnpm lint      # must fail
```

## Checklist before writing data access

1. Does a module for this domain exist? If not, create the four folders.
2. Is the shape I need already a domain entity? If not, define it from **what the view needs**, not from the collection.
3. Does the port already have a method for this? Add one to the interface first.
4. Which adapter — server, browser, or both?
5. Is the mapping explicit field by field?
6. Does the failure path produce a typed module error?
7. `pnpm lint && pnpm exec vitest run src/modules` green?

## Testing

Test the mapper against fixed DTOs and the adapter against a fake transport. Both are pure functions of their input; a running database only makes those assertions slower and flakier.

```ts
const repo = new PayloadRestProductRepository('https://shop.test', fakeFetch)
```

Constructor injection of the transport exists for exactly this. See `src/modules/catalog/infrastructure/repositories/PayloadRestProductRepository.spec.ts`.

## Related

- [CLOUDFLARE-TURSO.md](CLOUDFLARE-TURSO.md) — deployment, and why subrequest count is an architectural concern here
- [QUERIES.md](QUERIES.md) — query syntax, shown inside repositories
- [ADAPTERS.md](ADAPTERS.md) — Payload's own adapters, which are *not* the hexagon's adapters
