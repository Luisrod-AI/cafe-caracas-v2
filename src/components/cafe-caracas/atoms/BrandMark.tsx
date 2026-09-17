import { cn } from '@/utilities/cn'
import React from 'react'

type Props = {
  className?: string
  /** Diameter in px. 34 in the header, 44 in the empty state. */
  size?: number
}

/**
 * The coffee-bean roundel.
 *
 * Drawn rather than served as an image: it is two ellipses, so an SVG is
 * smaller than the request that would fetch a PNG of it, and it inherits
 * `currentColor` so the same mark works on the cream header and on a card.
 */
export const BrandMark: React.FC<Props> = ({ className, size = 34 }) => (
  <span
    aria-hidden="true"
    className={cn(
      'grid shrink-0 place-items-center rounded-full border border-[rgb(51_38_31_/_0.16)] bg-cc-surface text-cc-olive',
      className,
    )}
    style={{ width: size, height: size }}
  >
    <svg
      fill="none"
      height={size * 0.53}
      viewBox="0 0 18 18"
      width={size * 0.53}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="9" cy="9" fill="currentColor" rx="7.2" ry="8.2" />
      {/* The crease. Stroked in the surface colour so it reads as a gap in the
          bean rather than as a second shape drawn on top of it. */}
      <path
        d="M9 1.6c-2.6 2.4-2.6 12.4 0 14.8"
        stroke="var(--color-cc-surface)"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  </span>
)
