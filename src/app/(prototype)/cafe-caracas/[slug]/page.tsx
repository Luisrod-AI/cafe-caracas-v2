import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Brand } from '@/components/cafe-caracas/molecules/Brand'
import { CafeGallery } from '@/components/cafe-caracas/organisms/CafeGallery'
import { CafeLowerSections } from '@/components/cafe-caracas/organisms/CafeLowerSections'
import { CafeMenu } from '@/components/cafe-caracas/organisms/CafeMenu'
import { CafeSummaryCard } from '@/components/cafe-caracas/organisms/CafeSummaryCard'
import { DetailFooter } from '@/components/cafe-caracas/organisms/DetailFooter'
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
      <header className="bg-cc-header px-12 py-4 shadow-cc-header max-[900px]:px-6">
        <div className="flex items-center justify-between gap-6">
          <Brand />

          <Link
            className="inline-flex min-h-11 items-center rounded-full border border-[rgb(51_38_31/0.12)] bg-cc-surface px-5 text-[13px] font-semibold text-cc-olive-deep shadow-cc-pill transition-colors duration-200 hover:border-[rgb(51_38_31/0.24)]"
            href="/cafe-caracas"
          >
            ← Volver a explorar
          </Link>
        </div>
      </header>

      <main className="px-12 pt-6 max-[900px]:px-6">
        {/* The summary rail is a fixed 320px beside a fluid column — the same
            split the original uses, and the reason the gallery and the menu
            below it share one width. */}
        <div className="grid grid-cols-[1fr_320px] items-start gap-10 max-[1100px]:grid-cols-1">
          <div>
            <CafeGallery imageUrl={cafe.imageUrl} name={cafe.name} />

            <section className="grid grid-cols-[1fr_1.27fr] gap-11 pb-9 pt-8 max-[900px]:grid-cols-1 max-[900px]:gap-8">
              <div>
                {cafe.categories.length > 0 ? (
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.15em] text-cc-olive">
                    {cafe.categories.join(' / ')}
                  </p>
                ) : null}

                <h1 className="mt-2.5 font-cc-display text-[64px] font-bold leading-[0.95] tracking-[-0.04em] text-cc-ink-strong max-[900px]:text-[40px]">
                  {cafe.name}
                </h1>

                <p className="mt-3.5 flex flex-wrap items-center gap-2 text-sm text-cc-muted">
                  <span className="inline-flex items-center gap-1 font-semibold text-cc-ink">
                    <span aria-hidden="true">★</span>
                    {cafe.rating === null ? 'N/A' : cafe.rating.toFixed(1)}
                  </span>
                  {location ? <span aria-hidden="true">·</span> : null}
                  {location ? <span>{location}</span> : null}
                </p>

                <p className="mt-6 max-w-[580px] text-[15px] leading-relaxed text-[rgb(102_93_86)]">
                  {cafe.notes ??
                    `${cafe.name} forma parte de nuestra selección de cafés en Caracas. Aquí podrás consultar su ubicación, servicios, horario y más información relevante.`}
                </p>

                {cafe.website || cafe.instagram ? (
                  <div className="mt-6 flex flex-wrap gap-4">
                    {cafe.website ? (
                      <a
                        className="text-sm font-semibold text-cc-olive underline underline-offset-4"
                        href={cafe.website}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        Sitio web
                      </a>
                    ) : null}
                    {cafe.instagram ? (
                      <a
                        className="text-sm font-semibold text-cc-olive underline underline-offset-4"
                        href={cafe.instagram}
                        rel="noreferrer noopener"
                        target="_blank"
                      >
                        Instagram
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <CafeMenu items={cafe.menu} />
            </section>
          </div>

          <CafeSummaryCard cafe={cafe} />
        </div>

        <CafeLowerSections cafe={cafe} />
      </main>

      <DetailFooter />
    </div>
  )
}
