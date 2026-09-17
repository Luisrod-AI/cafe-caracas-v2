import type { Where } from 'payload'

import type { ProductQuery } from '../../domain/entities/Product'
import { PRODUCTS_PAGE_SIZE } from '../../domain/entities/Product'
import { PRODUCT_LIST_FIELDS } from '../dto/ProductDto'

/**
 * Domain query → CMS query.
 *
 * Shared by both adapters on purpose. The Local API and REST take the same
 * `where` object, so duplicating this translation would be the fastest way to
 * make the server-rendered grid and a client-side refetch disagree about what
 * "the same page" means.
 */

/**
 * Payload's own `Where` type, imported rather than re-declared.
 *
 * A hand-rolled `Record<string, unknown>` compiles and then silently accepts a
 * malformed clause — which the CMS answers with a 500 at request time. This is
 * infrastructure, so depending on the CMS type here is correct; it is exactly
 * the layer allowed to know what the CMS expects. The import is type-only, so
 * nothing reaches the client bundle.
 */
export type WhereClause = Where

export function buildProductWhere(query: ProductQuery): WhereClause | undefined {
  const conditions: WhereClause[] = []

  if (query.search) {
    conditions.push({
      or: [{ title: { like: query.search } }, { description: { like: query.search } }],
    })
  }

  if (query.categorySlug) {
    /**
     * Queried through the relationship's own field rather than by resolving the
     * slug to an id first. Payload walks the join itself, so this is one round
     * trip instead of two — and on Workers every round trip is a subrequest.
     */
    conditions.push({ 'categories.slug': { equals: query.categorySlug } })
  }

  if (conditions.length === 0) return undefined

  return { and: conditions }
}

/**
 * The fields to fetch.
 *
 * Built from the DTO's own field list so the `select` and the DTO type cannot
 * drift apart — adding a field to the DTO without fetching it is exactly the
 * kind of change that compiles and then renders blank.
 */
export function buildProductSelect(): Record<string, true> {
  return Object.fromEntries(PRODUCT_LIST_FIELDS.map((field) => [field, true])) as Record<
    string,
    true
  >
}

export function resolvePagination(query: ProductQuery): { page: number; limit: number } {
  return {
    page: query.page && query.page > 0 ? query.page : 1,
    limit: query.limit && query.limit > 0 ? query.limit : PRODUCTS_PAGE_SIZE,
  }
}

/**
 * Relationship depth.
 *
 * `1` expands the gallery image and the categories, which the grid renders.
 * `2` would additionally expand each category's own relationships — data no
 * view reads, paid for on every row.
 */
export const PRODUCT_LIST_DEPTH = 1
