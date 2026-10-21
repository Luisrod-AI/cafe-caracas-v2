import Image from 'next/image'
import Link from 'next/link'

import type { CafeSummary } from '@/modules/cafes'
import React from 'react'
import { Chip } from '../atoms/Chip'
import { FavoriteButton } from '../atoms/FavoriteButton'
import { Rating } from '../atoms/Rating'

type Props = {
  cafe: CafeSummary
  /** The first row is above the fold; its images should not lazy-load. */
  priority?: boolean
}

export const CafeCard: React.FC<Props> = ({
  cafe,
  priority = false,
}) => (
  <article className="group relative min-w-0">
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
            quality={85}
            sizes="(max-width: 900px) 100vw, (max-width: 1250px) 33vw, 377px"
            src={cafe.imageUrl}
            style={{
              filter:
                'saturate(0.82) contrast(1.04) brightness(0.98) sepia(0.08)',
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-full w-full place-items-center bg-gradient-to-br from-[#e9e2d7] via-[#d9d2c3] to-[#7b8060] text-[rgb(51_38_31_/_0.72)]"
          >
            <span className="font-cc-display text-[22px] tracking-[-0.02em]">
              Caracas Café
            </span>
          </div>
        )}
      </div>

      <div className="px-0.5 pt-[9px]">
        <div className="flex items-start justify-between gap-3.5">
          <h3 className="m-0 line-clamp-2 font-cc-display text-[18px] leading-[1.08] tracking-[-0.025em] text-cc-ink-strong">
            {cafe.name}
          </h3>

          <Rating value={cafe.rating} />
        </div>

        <p className="mb-6 mt-1 text-[13px] text-[rgb(69_32_24/0.78)]">
          {cafe.zone}
        </p>

        <div className="mt-2 flex flex-wrap gap-[5px]">
          {cafe.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate whitespace-nowrap text-[13px] leading-[18px] text-cc-muted">
            {cafe.price ?? 'Precio por verificar'}
          </span>

          <span className="shrink-0 whitespace-nowrap text-[13px] font-bold leading-[18px] text-cc-olive">
          Ver café →
          </span>
        </div>
      </div>
    </Link>

    <FavoriteButton
      cafeName={cafe.name}
      cafeSlug={cafe.slug}
    />
  </article>
)