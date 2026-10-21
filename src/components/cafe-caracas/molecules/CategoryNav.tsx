import React from 'react'
import { CategoryPill } from '../atoms/CategoryPill'

const CATEGORIES = [
  { href: '/cafe-caracas/search', isActive: true, label: 'Todo' },
  {
    href: '/cafe-caracas/search?concept=work',
    isActive: false,
    label: 'Para trabajar',
  },
  {
    href: '/cafe-caracas/search?concept=cozy',
    isActive: false,
    label: 'Para pasar el rato',
  },
  {
    href: '/cafe-caracas/search?concept=sightseeing',
    isActive: false,
    label: 'Con vista',
  },
] as const

/** The centred row of concept pills under the search bar. */
export const CategoryNav: React.FC = () => (
  <nav
    aria-label="Categorías principales"
    className="mx-auto mb-3 mt-2 flex flex-wrap items-center justify-center gap-2.5"
  >
    {CATEGORIES.map((category) => (
      <CategoryPill
        href={category.href}
        isActive={category.isActive}
        key={category.label}
        label={category.label}
      />
    ))}
  </nav>
)
