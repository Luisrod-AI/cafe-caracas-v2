import 'server-only'

import type { IProductRepository } from './domain/repositories/IProductRepository'
import { PayloadLocalProductRepository } from './infrastructure/repositories/PayloadLocalProductRepository'

/**
 * The catalog module's server-side surface.
 *
 * `import 'server-only'` makes the boundary mechanical: importing this file
 * from a client component fails the build with a clear message, instead of
 * silently shipping the entire Payload config to the browser.
 *
 * Everything from the shared barrel is re-exported, so a server component needs
 * one import, not two.
 */
export * from './index'

export { PayloadLocalProductRepository } from './infrastructure/repositories/PayloadLocalProductRepository'

/**
 * The repository for server-rendered code.
 *
 * A function rather than a module-level instance: on Workers an isolate is
 * reused across invocations, so anything holding per-request state at module
 * scope leaks between visitors.
 */
export function getProductRepository(): IProductRepository {
  return new PayloadLocalProductRepository()
}

// ── un-migrated seam ────────────────────────────────────────────────────────
/* Returns a raw CMS document, not a domain entity. Used only by the product
   detail page, whose block and variant rendering is still Payload-shaped. Read
   the header of productDocumentSource.ts before calling it from anywhere new. */
export {
  findProductDocumentBySlug,
  type ProductDocument,
} from './infrastructure/repositories/productDocumentSource'
