import Link from 'next/link'

import { cn } from '@/utilities/cn'
import React from 'react'

type Props = {
  href: string
  label: string
  isActive?: boolean
}

/**
 * One pill in the category row — "Todo", "Coworking", "Cozy".
 *
 * Active and inactive differ in three properties at once (fill, text, border),
 * so they are written as two complete branches rather than as a base plus
 * overrides. Overrides here produce the classic bug where the active pill keeps
 * the inactive border because one rule was forgotten.
 */
export const CategoryPill: React.FC<Props> = ({ href, isActive = false, label }) => (
  <Link
    className={cn(
      'inline-flex min-h-10 items-center justify-center rounded-full border px-[18px] text-[13px] font-semibold transition-colors duration-200',
      isActive
        ? 'border-cc-olive bg-cc-olive text-white'
        : 'border-[rgb(51_38_31_/_0.14)] bg-cc-surface text-cc-muted-deep hover:border-[rgb(51_38_31_/_0.28)]',
    )}
    href={href}
  >
    {label}
  </Link>
)
