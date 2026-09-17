import { CategoryPill } from '../atoms/CategoryPill'
import React from 'react'

const CATEGORIES = [
  { href: '/cafe-caracas', isActive: true, label: 'Todo' },
  { href: '/cafe-caracas?concept=coworking', isActive: false, label: 'Coworking' },
  { href: '/cafe-caracas?concept=cozy', isActive: false, label: 'Cozy' },
  { href: '/cafe-caracas?concept=sightseeing', isActive: false, label: 'Sightseeing' },
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
