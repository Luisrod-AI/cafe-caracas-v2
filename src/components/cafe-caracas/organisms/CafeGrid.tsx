import type { CafeSummary } from '@/modules/cafes'
import React from 'react'
import { CafeCard } from '../molecules/CafeCard'

type Props = {
  cafes: CafeSummary[]
}

/**
 * The four-column café grid.
 *
 * Breakpoints are max-width to mirror the prototype exactly: 4 columns, 3 below
 * 1250px, 2 below 900px, 1 below 620px. The project's Tailwind scale is
 * min-width and its stops do not land on those numbers, so the arbitrary
 * variants are deliberate — rounding them to `lg`/`xl` reflows the grid at
 * different widths than the design does.
 *
 * The column gap (16px) is tighter than the row gap (26px) on purpose: cards
 * have no frame, so the vertical space is what separates one card's footer from
 * the next card's image.
 */
export const CafeGrid: React.FC<Props> = ({ cafes }) => (
  <div className="grid grid-cols-4 gap-x-4 gap-y-[26px] max-[1250px]:grid-cols-3 max-[900px]:grid-cols-2 max-[620px]:grid-cols-1">
    {cafes.map((cafe, index) => (
      <CafeCard cafe={cafe} key={cafe.slug} priority={index < 4} />
    ))}
  </div>
)
