import Link from 'next/link'
import React from 'react'

/** The "♡ Favoritos" pill pinned to the right of the header. */
export const FavoritesLink: React.FC = () => (
  <Link
    aria-label="Ver mis cafés favoritos"
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgb(51_38_31_/_0.12)] bg-cc-surface px-[18px] text-[13px] font-semibold text-cc-olive-deep shadow-cc-pill transition-colors duration-200 hover:border-[rgb(51_38_31_/_0.24)]"
    href="/cafe-caracas"
  >
    <span aria-hidden="true" className="text-base leading-none">
      ♡
    </span>
    Favoritos
  </Link>
)
