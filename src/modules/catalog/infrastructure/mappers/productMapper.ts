import type {
  CatalogCategoryRef,
  ProductImage,
  ProductListItem,
  ProductPage,
} from '../../domain/entities/Product'
import { PRODUCTS_PAGE_SIZE } from '../../domain/entities/Product'
import type { CategoryRef, MediaRef, ProductListDto, ProductListItemDto } from '../dto/ProductDto'
import { isExpanded } from '../dto/ProductDto'

/**
 * Wire → domain. The only place `snake`-ish CMS shapes become the vocabulary
 * the application speaks.
 *
 * The mapping is explicit field by field and never `...dto`. A spread would let
 * `_status`, `enableVariants` and the whole variant tree through to the views
 * under CMS names, and the resulting failure is MUTE: `item.someField` reads
 * `undefined`, the grid renders without a price, and nothing throws.
 */

function toProductImage(ref: MediaRef | null | undefined, fallbackAlt: string): ProductImage | null {
  if (!isExpanded(ref)) return null
  if (!ref.url) return null

  return {
    url: ref.url,
    // The CMS marks `alt` required, but old rows predate that and arrive empty.
    // An empty string here would render an unlabelled image to a screen reader.
    alt: ref.alt || fallbackAlt,
    width: ref.width ?? null,
    height: ref.height ?? null,
  }
}

function toCatalogCategoryRef(ref: CategoryRef): CatalogCategoryRef | null {
  if (!isExpanded(ref)) return null

  return {
    id: String(ref.id),
    title: ref.title,
    slug: ref.slug,
  }
}

/**
 * The price a grid should show.
 *
 * For a product with variants the shopper reads the grid price as "from this
 * much", so it is the cheapest sellable variant rather than the product's own
 * `priceInUSD` — which for a variant product is often unset entirely.
 *
 * Deciding it here, once, is what keeps two different grids from disagreeing.
 */
function toDisplayPrice(dto: ProductListItemDto): number | null {
  const variantDocs = dto.variants?.docs ?? []

  const variantPrices = variantDocs
    .filter(isExpanded)
    .map((variant) => variant.priceInUSD)
    .filter((price): price is number => typeof price === 'number')

  if (dto.enableVariants && variantPrices.length > 0) {
    return Math.min(...variantPrices)
  }

  return typeof dto.priceInUSD === 'number' ? dto.priceInUSD : null
}

export function toProductListItem(dto: ProductListItemDto): ProductListItem {
  const firstGalleryEntry = dto.gallery?.[0]

  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    priceInUSD: toDisplayPrice(dto),
    image: toProductImage(firstGalleryEntry?.image, dto.title),
    categories: (dto.categories ?? [])
      .map(toCatalogCategoryRef)
      // Unexpanded relationships are dropped rather than rendered as bare ids:
      // a category chip showing "17" is worse than no chip.
      .filter((category): category is CatalogCategoryRef => category !== null),
  }
}

export function toProductPage(dto: ProductListDto): ProductPage {
  return {
    results: dto.docs.map(toProductListItem),
    page: dto.page ?? 1,
    limit: dto.limit ?? PRODUCTS_PAGE_SIZE,
    totalDocs: dto.totalDocs,
    hasNextPage: dto.hasNextPage,
  }
}
