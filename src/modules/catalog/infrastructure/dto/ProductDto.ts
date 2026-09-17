import type { Category, Media, Product, Variant } from '@/payload-types'

/**
 * The wire contract.
 *
 * This is the only file in the module allowed to import `@/payload-types`.
 * Everything downstream of the mapper speaks domain types, so a schema change
 * shows up here as a type error instead of reaching a component as `undefined`.
 *
 * The DTOs are expressed as views over the generated types rather than
 * hand-written copies: a hand-written copy drifts silently, while a view stops
 * compiling when the field it names disappears.
 */

/**
 * The fields `list()` asks Payload for.
 *
 * Kept in sync with the `select` in the Local adapter by construction — both
 * read from this key list, so adding a field in one place cannot leave the
 * other behind.
 */
export const PRODUCT_LIST_FIELDS = [
  'id',
  'title',
  'slug',
  'gallery',
  'categories',
  'priceInUSD',
] as const

/**
 * `variants` is deliberately absent.
 *
 * It is a join field, so selecting it makes the grid pay for one extra query
 * per row — on Workers that is one subrequest per row. The grid has never
 * actually rendered variant prices (the previous implementation read
 * `product.variants?.docs` from a query that never selected it, so the branch
 * was dead), and turning it on now would be a pricing change dressed up as a
 * refactor. The mapper still handles variants when a richer query provides
 * them, which is what `getBySlug` does.
 */

export type ProductListField = (typeof PRODUCT_LIST_FIELDS)[number]

/**
 * A product document as it arrives for a list query.
 *
 * `Partial` on the selected keys because `select` may still omit a field when
 * the document simply has no value for it, and because REST and Local API
 * differ on how they render empty relationships.
 */
export type ProductListItemDto = Pick<Product, 'id' | 'title' | 'slug'> &
  Partial<Pick<Product, 'gallery' | 'categories' | 'priceInUSD' | 'enableVariants' | 'variants'>>

/** A paginated response envelope, identical across Local API and REST. */
export interface ProductListDto {
  docs: ProductListItemDto[]
  page?: number | null
  limit: number
  totalDocs: number
  hasNextPage: boolean
}

/**
 * Relationship fields arrive either as a bare id or as the expanded document,
 * depending on `depth`. Both shapes are real, so both are named.
 */
export type MaybeExpanded<T> = number | string | T

export type MediaRef = MaybeExpanded<Media>
export type CategoryRef = MaybeExpanded<Category>
export type VariantRef = MaybeExpanded<Variant>

/** True when a relationship came back expanded rather than as an id. */
export function isExpanded<T extends object>(ref: MaybeExpanded<T> | null | undefined): ref is T {
  return typeof ref === 'object' && ref !== null
}

/**
 * A whole product document, unmapped.
 *
 * Named here rather than in the repository that returns it because this file is
 * the wire contract, and that is what this type is — the CMS document exactly
 * as it arrives. Its one consumer is the un-migrated detail view; see
 * `infrastructure/repositories/productDocumentSource.ts`.
 */
export type ProductDocumentDto = Product
