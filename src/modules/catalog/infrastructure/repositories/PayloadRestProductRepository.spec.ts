import { describe, expect, it } from 'vitest'

import { CATALOG_ERROR_KIND, CatalogError } from '../../domain/errors/CatalogErrors'
import { PayloadRestProductRepository } from './PayloadRestProductRepository'
import type { FetchLike } from './PayloadRestProductRepository'

/**
 * The adapter is exercised through a fake transport rather than a running
 * server. What is under test is the translation in both directions — domain
 * query to URL, and response to domain types or to a typed error — and a real
 * server would only make those assertions slower and flakier.
 */

const EMPTY_PAGE = {
  docs: [],
  page: 1,
  limit: 12,
  totalDocs: 0,
  hasNextPage: false,
}

/** Captures the URL it was called with and answers with whatever is given. */
function fakeFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const calls: string[] = []

  const impl: FetchLike = async (url) => {
    calls.push(url)

    return {
      ok: true,
      status: 200,
      json: async () => EMPTY_PAGE,
      ...response,
    } as Response
  }

  return { calls, impl }
}

function repositoryWith(response: Parameters<typeof fakeFetch>[0]) {
  const { calls, impl } = fakeFetch(response)

  return { calls, repo: new PayloadRestProductRepository('https://shop.test', impl) }
}

describe('PayloadRestProductRepository.list', () => {
  it('sends the search term as a title/description or-clause', async () => {
    const { calls, repo } = repositoryWith({})

    await repo.list({ search: 'blend' })

    // Conditions are always nested under `and` so that adding a second filter
    // never has to restructure the first one.
    const url = decodeURIComponent(calls[0])
    expect(url).toContain('where[and][0][or][0][title][like]=blend')
    expect(url).toContain('where[and][0][or][1][description][like]=blend')
  })

  it('filters by category through the relationship field, not a resolved id', async () => {
    const { calls, repo } = repositoryWith({})

    await repo.list({ categorySlug: 'coffee' })

    // One round trip, not two — on Workers each one costs a subrequest.
    expect(decodeURIComponent(calls[0])).toContain('[categories.slug][equals]=coffee')
  })

  it('sends no where clause at all when nothing is filtered', async () => {
    const { calls, repo } = repositoryWith({})

    await repo.list({})

    expect(calls[0]).not.toContain('where')
  })

  it('falls back to a title sort and the default page size', async () => {
    const { calls, repo } = repositoryWith({})

    await repo.list({})

    const url = decodeURIComponent(calls[0])
    expect(url).toContain('sort=title')
    expect(url).toContain('limit=12')
    expect(url).toContain('page=1')
  })

  it('ignores a non-positive page instead of forwarding it', async () => {
    const { calls, repo } = repositoryWith({})

    await repo.list({ page: 0 })

    // `page=0` is rejected by the CMS, which would turn a stray URL into a 500.
    expect(decodeURIComponent(calls[0])).toContain('page=1')
  })

  it('returns domain entities, not CMS documents', async () => {
    const { repo } = repositoryWith({
      json: async () => ({
        docs: [{ id: 5, title: 'Beans', slug: 'beans', priceInUSD: 900 }],
        page: 1,
        limit: 12,
        totalDocs: 1,
        hasNextPage: false,
      }),
    })

    const page = await repo.list({})

    expect(page.results).toEqual([
      {
        id: '5',
        slug: 'beans',
        title: 'Beans',
        priceInUSD: 900,
        image: null,
        categories: [],
      },
    ])
  })
})

describe('PayloadRestProductRepository error translation', () => {
  it('reports a refused connection as UNREACHABLE', async () => {
    const repo = new PayloadRestProductRepository('https://shop.test', async () => {
      throw new TypeError('fetch failed')
    })

    await expect(repo.list({})).rejects.toMatchObject({
      name: 'CatalogError',
      kind: CATALOG_ERROR_KIND.UNREACHABLE,
    })
  })

  it('reports a 403 as FORBIDDEN rather than a generic failure', async () => {
    const { repo } = repositoryWith({ ok: false, status: 403 })

    await expect(repo.list({})).rejects.toMatchObject({
      kind: CATALOG_ERROR_KIND.FORBIDDEN,
    })
  })

  it('reports a non-JSON body as a CONTRACT failure', async () => {
    const { repo } = repositoryWith({
      json: async () => {
        throw new SyntaxError('Unexpected token <')
      },
    })

    await expect(repo.list({})).rejects.toMatchObject({
      kind: CATALOG_ERROR_KIND.CONTRACT,
    })
  })

  it('reports a well-formed body with the wrong shape as a CONTRACT failure', async () => {
    const { repo } = repositoryWith({ json: async () => ({ unexpected: true }) })

    // A 200 with the wrong shape is the failure that otherwise reaches the view
    // as an empty grid and looks like "no products".
    await expect(repo.list({})).rejects.toBeInstanceOf(CatalogError)
  })
})

describe('PayloadRestProductRepository.getBySlug', () => {
  it('returns null for a slug with no product', async () => {
    const { repo } = repositoryWith({ json: async () => EMPTY_PAGE })

    // Null, not a thrown error: "no such product" is a 404 the page renders,
    // not a failure of the call.
    await expect(repo.getBySlug('missing')).resolves.toBeNull()
  })

  it('asks for exactly one document by slug', async () => {
    const { calls, repo } = repositoryWith({ json: async () => EMPTY_PAGE })

    await repo.getBySlug('caracas-blend')

    const url = decodeURIComponent(calls[0])
    expect(url).toContain('[slug][equals]=caracas-blend')
    expect(url).toContain('limit=1')
  })
})
