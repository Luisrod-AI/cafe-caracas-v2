import type { IProductRepository } from './domain/repositories/IProductRepository'
import { PayloadRestProductRepository } from './infrastructure/repositories/PayloadRestProductRepository'

/**
 * The catalog module's public surface, safe to import from anywhere.
 *
 * The server-side adapter is NOT here, and that separation is load-bearing
 * rather than stylistic: `PayloadLocalProductRepository` imports
 * `@payload-config`, which transitively pulls every collection, plugin and the
 * database adapter into whatever bundle touches it. A single client component
 * importing this barrel would drag all of that into the browser.
 *
 * Server code imports `@/modules/catalog/server`, which re-exports everything
 * below plus the Local adapter.
 */

// ── domain ──────────────────────────────────────────────────────────────────
export {
  PRODUCTS_PAGE_SIZE,
  PRODUCT_SORT,
  PRODUCT_SORT_VALUES,
  toProductSort,
} from './domain/entities/Product'
export type {
  CatalogCategoryRef,
  CategoryId,
  ProductId,
  ProductImage,
  ProductListItem,
  ProductPage,
  ProductQuery,
  ProductSort,
} from './domain/entities/Product'
export type { IProductRepository } from './domain/repositories/IProductRepository'
export {
  CATALOG_ERROR_KIND,
  CatalogError,
  type CatalogErrorKind,
} from './domain/errors/CatalogErrors'

// ── infrastructure ──────────────────────────────────────────────────────────
/* The adapter is exported so tests can construct it with a fake transport. The
   DTOs, mappers and query builders are NOT: they are adapter detail, and
   exporting them would let a component start mapping on its own. */
export {
  PayloadRestProductRepository,
  type FetchLike,
} from './infrastructure/repositories/PayloadRestProductRepository'

// ── composition root ────────────────────────────────────────────────────────

/**
 * The repository for browser code.
 *
 * A function rather than a shared instance, and a separate function rather than
 * a `typeof window` branch inside one: a runtime branch keeps the server
 * adapter in the client bundle, because the bundler cannot prove it is dead.
 */
export function getClientProductRepository(): IProductRepository {
  return new PayloadRestProductRepository()
}
