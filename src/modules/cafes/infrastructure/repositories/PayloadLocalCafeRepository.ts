import configPromise from '@payload-config'
import type { Where } from 'payload'
import { getPayload } from 'payload'

import {
  AMENITY_LABELS,
  CAFES_PAGE_SIZE,
  type CafeConceptFilter,
  type CafeDetail,
  type CafePage,
  type CafeQuery,
} from '../../domain/entities/Cafe'
import { CAFE_ERROR_KIND, CafeError } from '../../domain/errors/CafeErrors'
import type { ICafeRepository } from '../../domain/repositories/ICafeRepository'
import type { CafeDto, CafeListItemDto } from '../dto/CafeDto'
import { CAFE_LIST_FIELDS } from '../dto/CafeDto'
import { toCafeDetail, toCafePage } from '../mappers/cafeMapper'

/**
 * The server-side adapter: Payload's Local API, in process.
 *
 * No HTTP hop, which on Workers also means no subrequest — the request budget
 * goes to the database alone.
 *
 * Never import this from a client component: it pulls `@payload-config`, and
 * with it every collection and the database adapter, into whatever bundle
 * touches it. That is why it is exported from `server.ts` and not the barrel.
 */

/** Wraps a call so everything leaving the adapter is a `CafeError`. */
async function transact<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof CafeError) throw error

    const message = error instanceof Error ? error.message : String(error)
    const kind =
      error instanceof Error && error.name === 'Forbidden'
        ? CAFE_ERROR_KIND.FORBIDDEN
        : CAFE_ERROR_KIND.UNKNOWN

    throw new CafeError(kind, `Cafés query failed: ${message}`, error)
  }
}

function getMinimumPrice(cost: string | null | undefined): number | null {
  if (!cost) return null

  const match = String(cost).match(/\d+(?:\.\d+)?/)

  if (!match) return null

  const value = Number(match[0])

  return Number.isFinite(value) ? value : null
}

function matchesPriceFilter(
  cost: string | null | undefined,
  priceFilter: CafeQuery['price'],
): boolean {
  if (!priceFilter) return true

  const minimumPrice = getMinimumPrice(cost)

  if (minimumPrice === null) return false

  switch (priceFilter) {
    case 'under10':
      return minimumPrice <= 10

    case '10to20':
      return minimumPrice > 10 && minimumPrice <= 20

    case '20to30':
      return minimumPrice > 20 && minimumPrice <= 30

    case 'over30':
      return minimumPrice > 30

    default:
      return true
  }
}

const ZONE_GROUPS: Record<string, string[]> = {
  centro: ['centro', 'centro este', 'centro oeste'],
  este: ['este', 'sureste'],
  oeste: ['oeste'],
}

/**
 * Normalizes user input so accented and unaccented text are treated equally.
 *
 * Example:
 * "Café" -> "cafe"
 * "CAFÉ" -> "cafe"
 * "cafe" -> "cafe"
 */
function normalizeSearchText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Converts confirmed amenities into searchable labels.
 *
 * Example:
 * {
 *   wifi: 'yes',
 *   terrace: 'yes'
 * }
 *
 * becomes:
 * ['WiFi', 'Terraza']
 */
function getAmenitySearchLabels(amenities: unknown): string[] {
  if (!amenities || typeof amenities !== 'object') {
    return []
  }

  return Object.entries(amenities as Record<string, unknown>)
    .filter(([, value]) => value === 'yes')
    .map(
      ([key]) =>
        AMENITY_LABELS[key as keyof typeof AMENITY_LABELS] ?? key,
    )
}

/**
 * Searches across the information that users are likely to type.
 *
 * The search is intentionally broader than just the cafe name:
 * - name
 * - branch
 * - category
 * - notes
 * - municipality
 * - zone
 * - slug
 * - cost
 * - confirmed amenities
 *
 * Accents are ignored, and multiple words must all be present.
 */
function matchesSearchFilter(
  doc: CafeListItemDto,
  search: string,
): boolean {
  const normalizedSearch = normalizeSearchText(search)

  if (!normalizedSearch) {
    return true
  }

  const searchableText = normalizeSearchText(
    [
      doc.name,
      doc.branch,
      doc.category,
      doc.notes,
      doc.municipality,
      doc.zone,
      doc.slug,
      doc.cost,
      ...getAmenitySearchLabels(doc.amenities),
    ]
      .filter(Boolean)
      .join(' '),
  )

  const searchTerms = normalizedSearch.split(/\s+/)

  return searchTerms.every((term) =>
    searchableText.includes(term),
  )
}

function buildWhere(query: CafeQuery): undefined | Where {
  const and: Where[] = []

  if (query.zone) {
    const zones = ZONE_GROUPS[query.zone]

    if (zones?.length) {
      and.push({
        zone: {
          in: zones,
        },
      })
    }
  }

  if (query.concepts && query.concepts.length > 0) {
    const conceptConditions: Where[] = query.concepts.map(
      (concept: CafeConceptFilter) => ({
        [`amenities.${concept}`]: {
          equals: 'yes',
        },
      }),
    )

    and.push({
      or: conceptConditions,
    })
  }

  return and.length > 0 ? { and } : undefined
}

/** Built from the DTO's own field list so `select` and type cannot drift. */
function buildSelect(): Record<string, true> {
  return Object.fromEntries(
    CAFE_LIST_FIELDS.map((field) => [field, true]),
  ) as Record<string, true>
}

export class PayloadLocalCafeRepository implements ICafeRepository {
  async list(query: CafeQuery): Promise<CafePage> {
    return transact(async () => {
      const payload = await getPayload({ config: configPromise })

      const needsSearchFiltering = Boolean(query.search)

      const result = await payload.find({
        collection: 'cafes',
        depth: 1,

        /*
         * When search or price filtering is being done in memory,
         * retrieve the complete filtered dataset first.
         */
        limit:
          query.price || needsSearchFiltering
            ? undefined
            : query.limit ?? CAFES_PAGE_SIZE,

        overrideAccess: false,

        page:
          query.price || needsSearchFiltering
            ? undefined
            : query.page ?? 1,

        pagination:
          query.price || needsSearchFiltering
            ? false
            : true,

        select: buildSelect(),
        sort: 'name',
        where: buildWhere(query),
      })

      let filteredDocs = result.docs as unknown as CafeListItemDto[]

      /*
       * Free-text search:
       * accents are ignored and the search covers names, locations,
       * categories, notes, slugs, prices and amenities.
       */
      if (query.search) {
        filteredDocs = filteredDocs.filter((doc) =>
          matchesSearchFilter(doc, query.search!),
        )
      }

      /*
       * Price filtering is still handled in application code because
       * `cost` is stored as a flexible string.
       */
      if (query.price) {
        filteredDocs = filteredDocs.filter((doc) =>
          matchesPriceFilter(doc.cost, query.price),
        )
      }

      /*
       * If there are no in-memory filters, Payload already handled
       * pagination for us.
       */
      if (!query.price && !query.search) {
        return toCafePage(
          result as unknown as Parameters<typeof toCafePage>[0],
        )
      }

      /*
       * Search and/or price filtering happened in memory,
       * so pagination happens after filtering.
       */
      const pageSize = query.limit ?? CAFES_PAGE_SIZE
      const page = query.page ?? 1
      const start = (page - 1) * pageSize

      const pagedDocs = filteredDocs.slice(
        start,
        start + pageSize,
      )

      return toCafePage({
        docs: pagedDocs,
        totalDocs: filteredDocs.length,
        hasNextPage:
          start + pageSize < filteredDocs.length,
      })
    })
  }

  async getBySlug(slug: string): Promise<CafeDetail | null> {
    return transact(async () => {
      const payload = await getPayload({ config: configPromise })

      const result = await payload.find({
        collection: 'cafes',
        depth: 1,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        where: {
          slug: {
            equals: slug,
          },
        },
      })

      const doc = result.docs.at(0)

      return doc
        ? toCafeDetail(doc as unknown as CafeDto)
        : null
    })
  }
}

/** Kept for the type import above without widening the module's public surface. */
export type { CafeListItemDto }
