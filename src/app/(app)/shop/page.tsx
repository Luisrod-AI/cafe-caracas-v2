import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import { getProductRepository, toProductSort } from '@/modules/catalog/server'
import React from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

/** Search params arrive as `string | string[] | undefined`; only the first wins. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams

  const search = first(params.q)

  /**
   * The page's only job here is to turn a URL into a domain query. What that
   * query becomes on the wire — the `where` tree, the field selection, the
   * access rules — belongs to the repository, and used to live in this file.
   */
  const products = await getProductRepository().list({
    search,
    categorySlug: first(params.category),
    // Anything the domain does not recognise is dropped rather than forwarded:
    // an arbitrary `?sort=` value reaching the CMS is a 500, not a no-op.
    sort: toProductSort(first(params.sort)),
  })

  const resultsText = products.results.length === 1 ? 'result' : 'results'

  return (
    <div>
      {search ? (
        <p className="mb-4">
          {products.results.length === 0
            ? 'There are no products that match '
            : `Showing ${products.results.length} ${resultsText} for `}
          <span className="font-bold">&quot;{search}&quot;</span>
        </p>
      ) : null}

      {!search && products.results.length === 0 && (
        <p className="mb-4">No products found. Please try different filters.</p>
      )}

      {products.results.length > 0 ? (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.results.map((product) => (
            <ProductGridItem key={product.id} product={product} />
          ))}
        </Grid>
      ) : null}
    </div>
  )
}
