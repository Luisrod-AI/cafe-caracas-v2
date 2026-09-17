/**
 * The catalog, as the storefront understands it.
 *
 * Nothing in this file may import from `payload`, `@/payload-types`, React or
 * Next. The shapes here are chosen by what the views need, not by what the CMS
 * happens to store — that is the whole point of the boundary.
 */

/**
 * Identifiers are strings even though the database issues integers.
 *
 * The frontend never does arithmetic on an id, so an integer buys nothing and
 * leaks the database's autoincrement choice into every component that passes
 * one around. Converting at the mapper keeps that choice reversible: switching
 * Payload's `idType` to uuid later changes no domain code.
 */
export type ProductId = string

export type CategoryId = string

/** Sort orders the shop is allowed to ask for. */
export const PRODUCT_SORT = {
  TITLE_ASC: 'title',
  TITLE_DESC: '-title',
  NEWEST: '-createdAt',
  PRICE_ASC: 'priceInUSD',
  PRICE_DESC: '-priceInUSD',
} as const

export type ProductSort = (typeof PRODUCT_SORT)[keyof typeof PRODUCT_SORT]

export const PRODUCT_SORT_VALUES = Object.values(PRODUCT_SORT)

/** Narrows an arbitrary query string to a sort the repository accepts. */
export function toProductSort(value: string | undefined): ProductSort | undefined {
  if (!value) return undefined

  return PRODUCT_SORT_VALUES.includes(value as ProductSort) ? (value as ProductSort) : undefined
}

/**
 * An image ready to render.
 *
 * `url` is resolved by the adapter, so the view never has to know whether the
 * file came from local disk or from R2. `width` and `height` are nullable
 * because the CMS does not guarantee them for every upload, and inventing
 * numbers would cause layout shift rather than prevent it.
 */
export interface ProductImage {
  url: string
  alt: string
  width: number | null
  height: number | null
}

export interface CatalogCategoryRef {
  id: CategoryId
  title: string
  slug: string
}

/**
 * A row in the shop grid.
 *
 * Deliberately narrower than the CMS document: the grid renders an image, a
 * title and a price, and carrying the rest would mean every list query pays for
 * blocks, rich text and variant trees it never reads.
 */
export interface ProductListItem {
  id: ProductId
  slug: string
  title: string
  /**
   * The price the grid shows, in USD.
   *
   * For a product with variants this is the cheapest sellable variant, not the
   * product's own price — that is what a shopper reads a grid price as. The
   * choice is made in the mapper so every surface agrees on it; leaving it to
   * the component is how two grids end up disagreeing.
   *
   * `null` when nothing is priced, which is a real state and not a zero.
   */
  priceInUSD: number | null
  image: ProductImage | null
  categories: CatalogCategoryRef[]
}

/** One page of results, plus what the caller needs to ask for the next one. */
export interface ProductPage {
  results: ProductListItem[]
  page: number
  limit: number
  totalDocs: number
  hasNextPage: boolean
}

/** What the shop is allowed to filter and order by. */
export interface ProductQuery {
  /** Free text, matched against title and description. */
  search?: string
  /** Category **slug**, not id — the URL carries a slug. */
  categorySlug?: string
  sort?: ProductSort
  page?: number
  limit?: number
}

export const PRODUCTS_PAGE_SIZE = 12
