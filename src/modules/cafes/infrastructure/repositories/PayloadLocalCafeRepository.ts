import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import type { CafeDetail, CafePage, CafeQuery } from '../../domain/entities/Cafe'
import { CAFES_PAGE_SIZE } from '../../domain/entities/Cafe'
import { CAFE_ERROR_KIND, CafeError } from '../../domain/errors/CafeErrors'
import type { ICafeRepository } from '../../domain/repositories/ICafeRepository'
import { CAFE_LIST_FIELDS } from '../dto/CafeDto'
import type { CafeDto, CafeListItemDto } from '../dto/CafeDto'
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

function buildWhere(query: CafeQuery): undefined | Where {
  const and: Where[] = []

  if (query.search) {
    and.push({ name: { like: query.search } })
  }

  if (query.zone) {
    and.push({ zone: { equals: query.zone } })
  }

  return and.length > 0 ? { and } : undefined
}

/** Built from the DTO's own field list so `select` and type cannot drift. */
function buildSelect(): Record<string, true> {
  return Object.fromEntries(CAFE_LIST_FIELDS.map((f) => [f, true])) as Record<string, true>
}

export class PayloadLocalCafeRepository implements ICafeRepository {
  async list(query: CafeQuery): Promise<CafePage> {
    return transact(async () => {
      const payload = await getPayload({ config: configPromise })

      const result = await payload.find({
        collection: 'cafes',
        /**
         * `1` expands the media relationship the card renders. `2` would also
         * expand whatever those documents point at — data no view reads, paid
         * for on every one of 110 rows.
         */
        depth: 1,
        limit: query.limit ?? CAFES_PAGE_SIZE,
        /**
         * Access control decides what an anonymous visitor may read. Left at
         * its default `true`, this would return rows the public rule hides.
         */
        overrideAccess: false,
        page: query.page ?? 1,
        select: buildSelect(),
        sort: 'name',
        where: buildWhere(query),
      })

      return toCafePage(result as unknown as Parameters<typeof toCafePage>[0])
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
        where: { slug: { equals: slug } },
      })

      const doc = result.docs.at(0)

      return doc ? toCafeDetail(doc as unknown as CafeDto) : null
    })
  }
}

/** Kept for the type import above without widening the module's public surface. */
export type { CafeListItemDto }
