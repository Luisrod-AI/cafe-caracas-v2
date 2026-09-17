import Link from 'next/link'

import { BrandMark } from '../atoms/BrandMark'
import React from 'react'

/**
 * The logo lockup: roundel plus wordmark, with a tagline that only appears once
 * there is room for it.
 *
 * The tagline is hidden below `lg` rather than dropped, because it is real
 * content — the prototype hides it the same way at the same point.
 */
export const Brand: React.FC = () => (
  <Link className="flex items-center gap-3" href="/cafe-caracas">
    <BrandMark />

    <span className="flex flex-col leading-none">
      <strong className="font-cc-display text-2xl font-bold text-cc-ink">Caracas Café</strong>
      <small className="mt-0.5 hidden text-xs text-cc-muted lg:block">
        Descubre Caracas café por café
      </small>
    </span>
  </Link>
)
