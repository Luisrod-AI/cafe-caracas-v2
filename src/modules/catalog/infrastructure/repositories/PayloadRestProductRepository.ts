import { stringify } from 'qs-esm'

import type { ProductListItem, ProductPage, ProductQuery } from '../../domain/entities/Product'
import type { IProductRepository } from '../../domain/repositories/IProductRepository'
import { CATALOG_ERROR_KIND, CatalogError } from '../../domain/errors/CatalogErrors'
import type { ProductListDto } from '../dto/ProductDto'
import { toProductListItem, toProductPage } from '../mappers/productMapper'
import {
  PRODUCT_LIST_DEPTH,
  buildProductWhere,
  resolvePagination,
} from './productQuery'

/**
 * The browser-side adapter: Payload's REST API over `fetch`.
 *
 * Same port, same domain types, same query translation as the Local adapter —
 * only the transport differs. A client component that needs to refetch the grid
 * uses this one and gets results that are identical to what the server rendered.
 *
 * `select` is not sent: Payload's REST `select` syntax is bracketed rather than
 * a plain object, and the saving does not justify a second serialisation path
 * that can drift from the Local one. Depth still bounds the payload.
 */

/** Minimal fetch shape, so tests can pass a fake without a DOM. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export class PayloadRestProductRepository implements IProductRepository {
  constructor(
    private readonly baseUrl: string = process.env.NEXT_PUBLIC_SERVER_URL || '',
    private readonly fetchImpl: FetchLike = (input, init) => fetch(input, init),
  ) {}

  private async request<T>(path: string, params: Record<string, unknown>): Promise<T> {
    const query = stringify(params, { addQueryPrefix: true })
    const url = `${this.baseUrl}/api${path}${query}`

    let response: Response

    try {
      response = await this.fetchImpl(url, {
        // The storefront reads public data; sending cookies would turn every
        // grid request into an uncacheable, user-specific one.
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      throw new CatalogError(
        CATALOG_ERROR_KIND.UNREACHABLE,
        `Could not reach the catalog API at ${url}`,
        error,
      )
    }

    if (response.status === 401 || response.status === 403) {
      throw new CatalogError(CATALOG_ERROR_KIND.FORBIDDEN, `Catalog access denied for ${path}`)
    }

    if (!response.ok) {
      throw new CatalogError(
        CATALOG_ERROR_KIND.UNKNOWN,
        `Catalog API returned ${response.status} for ${path}`,
      )
    }

    try {
      return (await response.json()) as T
    } catch (error) {
      throw new CatalogError(
        CATALOG_ERROR_KIND.CONTRACT,
        `Catalog API returned a body that is not JSON for ${path}`,
        error,
      )
    }
  }

  async list(query: ProductQuery): Promise<ProductPage> {
    const { page, limit } = resolvePagination(query)

    const dto = await this.request<ProductListDto>('/products', {
      depth: PRODUCT_LIST_DEPTH,
      draft: false,
      limit,
      page,
      sort: query.sort ?? 'title',
      where: buildProductWhere(query),
    })

    if (!dto || !Array.isArray(dto.docs)) {
      throw new CatalogError(
        CATALOG_ERROR_KIND.CONTRACT,
        'Catalog API returned a list without a `docs` array',
      )
    }

    return toProductPage(dto)
  }

  async getBySlug(slug: string): Promise<ProductListItem | null> {
    const dto = await this.request<ProductListDto>('/products', {
      depth: 2,
      draft: false,
      limit: 1,
      where: { slug: { equals: slug } },
    })

    const doc = dto?.docs?.at(0)

    return doc ? toProductListItem(doc) : null
  }
}
