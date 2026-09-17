import type { ProductListItem, ProductPage, ProductQuery } from '../entities/Product'

/**
 * The port.
 *
 * This interface is the only thing the presentation layer is allowed to know
 * about how catalog data is obtained. Two adapters implement it — one over
 * Payload's Local API for server components, one over the REST API for the
 * browser — and neither name appears outside `infrastructure/`.
 *
 * Every method returns domain types and throws `CatalogError`.
 */
export interface IProductRepository {
  /** One page of the shop grid, filtered and ordered. */
  list(query: ProductQuery): Promise<ProductPage>

  /**
   * A single product by its URL slug, or `null` when there is none.
   *
   * `null` rather than a thrown error: "no product at this slug" is an ordinary
   * outcome that the page turns into a 404, not a failure of the call.
   */
  getBySlug(slug: string): Promise<ProductListItem | null>
}
