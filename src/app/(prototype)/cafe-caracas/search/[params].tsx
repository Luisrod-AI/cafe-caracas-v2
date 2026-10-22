import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { getCafeRepository } from '@/modules/cafes/server'

type Props = {
  params: Promise<{ slug: string }>
}

/**
 * Metadata and the page body both need the café, and Next runs them as separate
 * calls. Deduplicated with `React.cache` so one request hits the database once
 * instead of twice — on Workers the second lookup is a wasted subrequest.
 */
const findCafe = React.cache(async (slug: string) => getCafeRepository().getBySlug(slug))

/**
 * Rendered per request, never prerendered.
 *
 * Two reasons, and both are load-bearing:
 *
 * 1. Prerendering needs a database at BUILD time. The build runs wherever CI
 *    happens to run, which is not guaranteed to reach Turso — and it failed
 *    exactly there: `no such table: cafes`.
 * 2. Freezing this page at build time means a café edited in the admin does not
 *    change the site until the next deploy. For a directory whose whole point
 *    is the CMS, that is the wrong default.
 *
 * The cost is one database round trip per request. On Workers that is one
 * subrequest, well inside the paid budget.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cafe = await findCafe(slug)

  if (!cafe) return { title: 'Café no encontrado | Caracas Café' }

  return {
    description:
      cafe.notes ??
      `${cafe.name} forma parte de nuestra selección de cafés en Caracas. Consulta su ubicación, servicios y horario.`,
    title: `${cafe.name} | Caracas Café`,
  }
}

/**
 * A café's detail page.
 *
 * Reached at `/cafe-caracas/<slug>` — the same key the grid links to, and the
 * prototype's `cafe.html?cafe=<slug>` expressed as a path so the route can be
 * cached and crawled.
 *
 * Layout, top to bottom: a four-tile photo mosaic; a two-column overview with
 * the name on the left and the featured menu on the right; a summary rail
 * pinned to the right of both; then amenities, location and reviews.
 */
export default async function CafeDetailPage({ params }: Props) {
  const { slug } = await params
  const cafe = await findCafe(slug)

  /* A slug nobody has is a 404, not an error page: the repository returns
     `null` precisely so this stays a routing decision. */
  if (!cafe) notFound()

  const location = [cafe.neighborhood, cafe.municipality].filter(Boolean).join(' / ')

  return (
  <div className="min-h-screen bg-cc-page">
  </div>
  )
}
