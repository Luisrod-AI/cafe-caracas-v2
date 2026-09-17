import type { Metadata } from 'next'
import React from 'react'

import { SectionHeading } from '@/components/cafe-caracas/molecules/SectionHeading'
import { AppHeader } from '@/components/cafe-caracas/organisms/AppHeader'
import { CafeGrid } from '@/components/cafe-caracas/organisms/CafeGrid'
import { Sidebar } from '@/components/cafe-caracas/organisms/Sidebar'
import { SiteFooter } from '@/components/cafe-caracas/organisms/SiteFooter'
import { getCafeRepository } from '@/modules/cafes/server'

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

export const metadata: Metadata = {
  description:
    'Directorio de cafés en Caracas. Descubre lugares para tomar café, trabajar o reunirte.',
  title: 'Cafés de Caracas',
}

/**
 * The Caracas Café directory home, reading from Payload.
 *
 * The page's only job is to ask the repository and lay the answer out. What
 * that query becomes on the wire — the `where` tree, the field selection, the
 * access rules, the media expansion — belongs to `@/modules/cafes` and is
 * invisible here on purpose: that is what lets the detail page reuse the same
 * rules instead of copying them.
 *
 * The search bar, the category pills and the favourite hearts are still inert.
 * They are seams waiting for their own queries, not oversights.
 */
export default async function CafeCaracasPage() {
  const cafes = await getCafeRepository().list({})

  return (
    <div className="min-h-screen bg-cc-page">
      <AppHeader />

      <main className="px-12 pb-16 pt-1.5 max-[900px]:px-6">
        {/* 340px is a fixed rail, not a fraction: the sidebar holds a
            fixed-size ad slot, so letting it flex would resize the placeholder
            rather than the grid beside it. */}
        <div className="grid grid-cols-[1fr_340px] items-start gap-6 max-[1100px]:grid-cols-1">
          <section aria-labelledby="directory-title">
            <SectionHeading
              count={`${cafes.totalDocs} cafés`}
              id="directory-title"
              title="Explora cafés en Caracas"
            />

            <CafeGrid cafes={cafes.results} />
          </section>

          <Sidebar />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
