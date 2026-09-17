import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { ProductListItem, ProductPage, ProductQuery } from '../../domain/entities/Product'
import type { IProductRepository } from '../../domain/repositories/IProductRepository'
import { CATALOG_ERROR_KIND, CatalogError } from '../../domain/errors/CatalogErrors'
import type { ProductListDto, ProductListItemDto } from '../dto/ProductDto'
import { toProductListItem, toProductPage } from '../mappers/productMapper'
import {
  PRODUCT_LIST_DEPTH,
  buildProductSelect,
  buildProductWhere,
  resolvePagination,
} from './productQuery'

/**
 * The server-side adapter: Payload's Local API, in process.
 *
 * Used by server components. There is no HTTP hop, which on Workers also means
 * no subrequest — the request budget is spent on the database only.
 *
 * Never import this from a client component. It pulls the entire Payload config
 * — collections, plugins, the database adapter — into whatever bundle imports
 * it. Client code goes through `PayloadRestProductRepository` instead.
 */

/** Wraps a call so everything leaving the adapter is a `CatalogError`. */
async function transact<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof CatalogError) throw error

    const message = error instanceof Error ? error.message : String(error)

    // Payload surfaces access denials as an error with this name.
    const kind =
      error instanceof Error && error.name === 'Forbidden'
        ? CATALOG_ERROR_KIND.FORBIDDEN
        : CATALOG_ERROR_KIND.UNKNOWN

    throw new CatalogError(kind, `Catalog query failed: ${message}`, error)
  }
}

export class PayloadLocalProductRepository implements IProductRepository {
  async list(query: ProductQuery): Promise<ProductPage> {
    return transact(async () => {
      const payload = await getPayload({ config: configPromise })
      const { page, limit } = resolvePagination(query)

      const result = await payload.find({
        collection: 'products',
        depth: PRODUCT_LIST_DEPTH,
        draft: false,
        limit,
        page,
        /**
         * Access control decides what an anonymous visitor may read, which is
         * how drafts stay out of the shop. Leaving this at its default `true`
         * would return unpublished products to the public grid.
         */
        overrideAccess: false,
        select: buildProductSelect(),
        sort: query.sort ?? 'title',
        where: buildProductWhere(query),
      })

      return toProductPage(result as unknown as ProductListDto)
    })
  }

  async getBySlug(slug: string): Promise<ProductListItem | null> {
    return transact(async () => {
      const payload = await getPayload({ config: configPromise })

      const result = await payload.find({
        collection: 'products',
        /**
         * Deeper than the list: the detail view renders the gallery and the
         * variant prices, and both sit one level further in than the grid needs.
         */
        depth: 2,
        draft: false,
        limit: 1,
        overrideAccess: false,
        pagination: false,
        where: { slug: { equals: slug } },
      })

      const doc = result.docs.at(0)

      if (!doc) return null

      return toProductListItem(doc as unknown as ProductListItemDto)
    })
  }
}
