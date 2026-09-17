import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { CATALOG_ERROR_KIND, CatalogError } from '../../domain/errors/CatalogErrors'
import type { ProductDocumentDto } from '../dto/ProductDto'

/**
 * The un-migrated seam — read this before using it.
 *
 * This returns the raw CMS document rather than a domain entity, which is
 * exactly what the rest of the module exists to avoid. It is here on purpose,
 * and it is temporary.
 *
 * WHY IT EXISTS
 * -------------
 * The product detail page renders two surfaces that are genuinely Payload-
 * shaped and not yet decoupled:
 *
 *   - `product.layout`, fed to `RenderBlocks`, which dispatches on Payload's
 *     block discriminators.
 *   - `ProductDescription`, a client component from the ecommerce plugin that
 *     reads `priceIn${currency.code}` off the document by computed key and
 *     drives the cart and variant selector.
 *
 * Mapping those to domain types means redesigning rich-text and block rendering
 * and untangling the cart flow — a separate piece of work, not a rename.
 *
 * WHAT THIS BUYS ANYWAY
 * ---------------------
 * The coupling is now in ONE named file instead of inline in a page component.
 * The page no longer calls `getPayload`, the query and its access rules are
 * reviewable next to the rest of the module, and the day the detail view is
 * migrated, deleting this file is the whole change.
 *
 * DO NOT reach for this from new code. New surfaces use `IProductRepository`.
 */

export type ProductDocument = ProductDocumentDto

interface FindArgs {
  slug: string
  /** Preview mode. Draft reads require bypassing access control. */
  draft: boolean
}

export async function findProductDocumentBySlug({
  slug,
  draft,
}: FindArgs): Promise<ProductDocument | null> {
  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'products',
      depth: 3,
      draft,
      limit: 1,
      /**
       * Only preview bypasses access control, and only because a draft is by
       * definition not readable by the public rule. For a normal visit this
       * stays `false`, so the CMS decides what is visible.
       */
      overrideAccess: draft,
      pagination: false,
      populate: {
        variants: {
          title: true,
          priceInUSD: true,
          inventory: true,
          options: true,
        },
      },
      where: {
        and: [
          { slug: { equals: slug } },
          // Redundant with access control for anonymous reads, kept because a
          // logged-in admin browsing the storefront would otherwise see drafts.
          ...(draft ? [] : [{ _status: { equals: 'published' } }]),
        ],
      },
    })

    return result.docs?.[0] ?? null
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw new CatalogError(
      CATALOG_ERROR_KIND.UNKNOWN,
      `Could not load the product document for "${slug}": ${message}`,
      error,
    )
  }
}
