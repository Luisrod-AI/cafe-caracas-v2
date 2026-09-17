import Image from 'next/image'
import Link from 'next/link'

import { Chip } from '../atoms/Chip'
import { FavoriteButton } from '../atoms/FavoriteButton'
import { Rating } from '../atoms/Rating'
import type { CafeSummary } from '@/modules/cafes'
import React from 'react'

type Props = {
  cafe: CafeSummary
  /** The first row is above the fold; its images should not lazy-load. */
  priority?: boolean
}

/**
 * A cell in the café grid.
 *
 * The card has no frame of its own — no border, no background, no shadow. All
 * the elevation lives on the image, which lifts and scales on hover while the
 * text stays still. Wrapping the whole thing in a panel is the single easiest
 * way to lose the look.
 *
 * The image carries a colour treatment (`saturate/contrast/brightness/sepia`)
 * that is doing real work: it pulls 110 photos shot on different phones, in
 * different light, into one warm register. Without it the grid reads as a pile
 * of unrelated pictures.
 */
export const CafeCard: React.FC<Props> = ({ cafe, priority = false }) => (
  <article className="group min-w-0">
    <Link
      aria-label={`Ver detalles de ${cafe.name}`}
      className="block text-inherit no-underline"
      href={`/cafe-caracas/${cafe.slug}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-gradient-to-br from-[rgb(100_106_69_/_0.12)] to-[rgb(230_221_207_/_0.72)] transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-cc-media">
        {cafe.imageUrl ? (
          <Image
            alt={cafe.name}
            className="h-full w-full object-cover transition-transform duration-[260ms] group-hover:scale-[1.035]"
            fill
            priority={priority}
            sizes="(max-width: 900px) 50vw, (max-width: 1250px) 33vw, 240px"
            src={cafe.imageUrl}
            style={{ filter: 'saturate(0.82) contrast(1.04) brightness(0.98) sepia(0.08)' }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-full w-full place-items-center bg-gradient-to-br from-[#e9e2d7] via-[#d9d2c3] to-[#7b8060] text-[rgb(51_38_31_/_0.72)]"
          >
            <span className="font-cc-display text-[22px] tracking-[-0.02em]">Caracas Café</span>
          </div>
        )}

        <FavoriteButton cafeName={cafe.name} />
      </div>

      <div className="px-0.5 pt-[9px]">
        <div className="flex items-start justify-between gap-3.5">
          {/* Clamped to two lines: names run from "Grau" to "Pastelería y
              Chocolatería Mozart", and an unclamped title pushes the whole row
              of cards out of alignment. */}
          <h3 className="m-0 line-clamp-2 font-cc-display text-[18px] leading-[1.08] tracking-[-0.025em] text-cc-ink-strong">
            {cafe.name}
          </h3>

          <Rating value={cafe.rating} />
        </div>

        {/* The 24px below is what sets the card's whole lower rhythm — it
            collapses with the chips' own 8px, so the chips sit 24px down, not
            32px. */}
        <p className="mb-6 mt-1 text-[13px] text-[rgb(69_32_24/0.78)]">{cafe.zone}</p>

        <div className="mt-2 flex flex-wrap gap-[5px]">
          {cafe.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>

        {/*
          The footer must stay on ONE line. If "Precio por verificar" wraps,
          that card grows and the whole row of cards falls out of alignment.

          `nowrap` rather than trusting the width to fit: the longest price and
          the action together measure within a pixel or two of the 225px
          available, and the exact figure depends on how the font renders — the
          prototype's own Inter draws the same string ~15% narrower than ours
          does, which is enough to flip the outcome. The price truncates, so an
          unexpectedly long value degrades instead of breaking the grid.
        */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate whitespace-nowrap text-[13px] leading-[18px] text-cc-muted">
            {cafe.price ?? 'Precio por verificar'}
          </span>
          <span className="shrink-0 whitespace-nowrap text-[13px] font-bold leading-[18px] text-cc-olive">
            Ver ubicación →
          </span>
        </div>
      </div>
    </Link>
  </article>
)
