import type {
  AmenityKey,
  CafeDetail,
  CafePage,
  CafeSummary,
  MenuItem,
  OpeningHours,
  Weekday,
} from '../../domain/entities/Cafe'
import { AMENITY_ORDER, WEEKDAY_ORDER } from '../../domain/entities/Cafe'
import type { CafeDto, CafeListItemDto, MediaRef } from '../dto/CafeDto'
import { isExpandedMedia } from '../dto/CafeDto'

/**
 * Wire → domain. The only place the CMS shape becomes the application's.
 *
 * Explicit field by field, never `...dto`. A spread would let `filterReady`,
 * `sourceUrl` and the whole `research` block reach the views under CMS names,
 * and the failure is MUTE: the property reads `undefined`, the card renders
 * without a price, and nothing throws.
 */

/**
 * An uploaded Media document wins over the seeded external URL.
 *
 * Both exist on purpose during the migration from the prototype's assets: this
 * is the single place that prefers one, so emptying `imageUrl` row by row needs
 * no other change.
 */
function toImageUrl(image: MediaRef, imageUrl: string | null | undefined): string | null {
  if (isExpandedMedia(image) && image.url) return image.url
  return imageUrl || null
}

/**
 * The chips under a name.
 *
 * `category` and `notes` are free text holding several values joined by `/`,
 * `,` or `·`. Splitting happens here rather than in the view so that every
 * surface shows the same two, in the same order.
 */
function toTags(category: string | null | undefined, notes: string | null | undefined): string[] {
  const parts = [category, notes]
    .filter(Boolean)
    .flatMap((value) => String(value).split(/[,/·]/))
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.length > 0 ? parts.slice(0, 2) : ['Cafetería']
}

function toCategories(category: string | null | undefined): string[] {
  if (!category) return []
  return String(category)
    .split(/[,/·]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function toCafeSummary(dto: CafeListItemDto): CafeSummary {
  return {
    id: String(dto.id),
    imageUrl: toImageUrl(dto.image, dto.imageUrl),
    name: dto.name,
    /* The fallback chain mirrors the source data's own precedence: the most
       specific location known, down to the city. */
    price: dto.cost || null,
    rating: typeof dto.rate === 'number' ? dto.rate : null,
    slug: dto.slug ?? '',
    tags: toTags(dto.category, dto.notes),
    zone: dto.municipality || dto.branch || dto.zone || 'Caracas',
  }
}

function toHours(dto: CafeDto): Partial<Record<Weekday, OpeningHours>> {
  const source = dto.hours
  if (!source) return {}

  const out: Partial<Record<Weekday, OpeningHours>> = {}

  for (const day of WEEKDAY_ORDER) {
    const value = source[day]
    /* Both ends are required: a row with an opening time and no closing time
       cannot be rendered as a range, and showing "5:00 p.m. – " is worse than
       showing nothing. */
    if (value?.open && value?.close) {
      out[day] = { close: value.close, open: value.open }
    }
  }

  return out
}

/**
 * Only the amenities confirmed present.
 *
 * `unknown` is dropped along with `no`: the detail page lists what a café HAS,
 * and an unverified flag is not a promise.
 */
function toAmenities(dto: CafeDto): AmenityKey[] {
  const source = dto.amenities
  if (!source) return []

  return AMENITY_ORDER.filter((key) => source[key] === 'yes')
}

/**
 * Turns a stored price into what the card shows.
 *
 * The source carries a bare number plus a currency code — `5` + `USD` — and the
 * original renders "$5.00". Formatting here and not in the seed keeps the
 * stored value raw: the day prices need sorting or converting, the number is
 * still a number.
 *
 * A price that is not numeric passes through untouched, because the field also
 * holds things like "5-10$" that no formatter should rewrite.
 */
function toMenuPrice(price: string | null | undefined, currency: string | null | undefined): string | null {
  if (!price) return null

  const amount = Number(price)
  if (Number.isNaN(amount)) return price

  return currency === 'USD' ? `$${amount.toFixed(2)}` : `${amount.toFixed(2)}`
}

function toMenu(dto: CafeDto): MenuItem[] {
  return (dto.menu ?? [])
    .filter((item) => item?.name)
    .map((item) => ({
      name: item.name,
      imageUrl: item.imageUrl || null,
      price: toMenuPrice(item.price, item.currency),
    }))
}

export function toCafeDetail(dto: CafeDto): CafeDetail {
  const hours = toHours(dto)

  return {
    ...toCafeSummary(dto),
    /* Built from the most specific part outwards, skipping what is missing, so
       a café with no neighbourhood still reads as a real address. */
    address: [dto.neighborhood, dto.municipality, 'Caracas'].filter(Boolean).join(' · '),
    amenities: toAmenities(dto),
    hoursUnknown: Object.keys(hours).length === 0,
    menu: toMenu(dto),
    categories: toCategories(dto.category),
    /* Only surfaced when the record says the coordinates were actually
       verified — an unverified pair still renders a pin, just the wrong one. */
    coordinates:
      dto.filterReady?.coordinates && typeof dto.latitude === 'number' && typeof dto.longitude === 'number'
        ? { latitude: dto.latitude, longitude: dto.longitude }
        : null,
    hours,
    instagram: dto.instagram || null,
    /* `location` is the exact Maps listing, `link` a search for the name. The
       precise one first. */
    mapUrl: dto.location || dto.link || null,
    municipality: dto.municipality || null,
    neighborhood: dto.neighborhood || null,
    notes: dto.notes || null,
    website: dto.website || null,
  }
}

export function toCafePage(result: {
  docs: CafeListItemDto[]
  totalDocs: number
  hasNextPage: boolean
}): CafePage {
  return {
    hasNextPage: result.hasNextPage,
    results: result.docs.map(toCafeSummary),
    totalDocs: result.totalDocs,
  }
}
