import { describe, expect, it } from 'vitest'

import type { ProductListDto, ProductListItemDto } from '../dto/ProductDto'
import { toProductListItem, toProductPage } from './productMapper'

/**
 * The mapper is the one place the CMS shape becomes the application's shape, so
 * it is tested against fixed documents rather than through a running database.
 * These assertions are the contract: if the CMS changes underneath, one of them
 * breaks and names the field.
 */

function productDto(overrides: Partial<ProductListItemDto> = {}): ProductListItemDto {
  return {
    id: 42,
    title: 'Caracas Blend',
    slug: 'caracas-blend',
    ...overrides,
  }
}

describe('toProductListItem', () => {
  it('turns the numeric database id into a string', () => {
    expect(toProductListItem(productDto()).id).toBe('42')
  })

  it('carries no CMS-named fields through to the domain object', () => {
    const item = toProductListItem(
      productDto({
        // Fields the domain never declared. A `...dto` spread would let all
        // three reach the views under their database names.
        enableVariants: true,
        priceInUSD: 10,
      } as Partial<ProductListItemDto>),
    )

    expect(Object.keys(item).sort()).toEqual([
      'categories',
      'id',
      'image',
      'priceInUSD',
      'slug',
      'title',
    ])
  })

  describe('price', () => {
    it("uses the product's own price when there are no variants", () => {
      expect(toProductListItem(productDto({ priceInUSD: 1250 })).priceInUSD).toBe(1250)
    })

    it('reports null rather than zero when nothing is priced', () => {
      expect(toProductListItem(productDto()).priceInUSD).toBeNull()
    })

    it('shows the cheapest variant when variants are enabled', () => {
      const item = toProductListItem(
        productDto({
          enableVariants: true,
          priceInUSD: 9999,
          variants: {
            docs: [
              { id: 2, priceInUSD: 1800 },
              { id: 1, priceInUSD: 1200 },
            ],
          },
        } as Partial<ProductListItemDto>),
      )

      expect(item.priceInUSD).toBe(1200)
    })

    it('ignores variant prices when variants are disabled on the product', () => {
      const item = toProductListItem(
        productDto({
          enableVariants: false,
          priceInUSD: 9999,
          variants: { docs: [{ id: 1, priceInUSD: 1 }] },
        } as Partial<ProductListItemDto>),
      )

      expect(item.priceInUSD).toBe(9999)
    })
  })

  describe('image', () => {
    it('reads the first gallery entry', () => {
      const item = toProductListItem(
        productDto({
          gallery: [
            {
              image: { id: 7, url: '/api/media/file/bag.jpg', alt: 'A bag', width: 800, height: 600 },
            },
          ],
        } as Partial<ProductListItemDto>),
      )

      expect(item.image).toEqual({
        url: '/api/media/file/bag.jpg',
        alt: 'A bag',
        width: 800,
        height: 600,
      })
    })

    it('falls back to the product title when alt text is missing', () => {
      const item = toProductListItem(
        productDto({
          gallery: [{ image: { id: 7, url: '/f.jpg', alt: '' } }],
        } as Partial<ProductListItemDto>),
      )

      // An empty alt would ship an unlabelled image to a screen reader.
      expect(item.image?.alt).toBe('Caracas Blend')
    })

    it('reports null when the relationship came back as a bare id', () => {
      const item = toProductListItem(
        productDto({ gallery: [{ image: 7 }] } as Partial<ProductListItemDto>),
      )

      expect(item.image).toBeNull()
    })
  })

  describe('categories', () => {
    it('maps expanded categories and drops unexpanded ones', () => {
      const item = toProductListItem(
        productDto({
          categories: [{ id: 3, title: 'Coffee', slug: 'coffee' }, 9],
        } as Partial<ProductListItemDto>),
      )

      // A chip reading "9" is worse than no chip at all.
      expect(item.categories).toEqual([{ id: '3', title: 'Coffee', slug: 'coffee' }])
    })
  })
})

describe('toProductPage', () => {
  it('renames the CMS envelope into the domain one', () => {
    const dto: ProductListDto = {
      docs: [productDto()],
      page: 2,
      limit: 12,
      totalDocs: 30,
      hasNextPage: true,
    }

    expect(toProductPage(dto)).toEqual({
      results: [toProductListItem(productDto())],
      page: 2,
      limit: 12,
      totalDocs: 30,
      hasNextPage: true,
    })
  })

  it('defaults the page to 1 when the CMS omits it', () => {
    const dto: ProductListDto = {
      docs: [],
      page: null,
      limit: 12,
      totalDocs: 0,
      hasNextPage: false,
    }

    expect(toProductPage(dto).page).toBe(1)
  })
})
