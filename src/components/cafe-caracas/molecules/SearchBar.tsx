import { SearchSegment } from '../atoms/SearchSegment'
import React from 'react'

const SEGMENTS = [
  { label: 'Zona', value: 'Todas las zonas' },
  { label: 'Concepto', value: '¿Cómo es el café?' },
  { label: 'Precio', value: 'Todos los precios' },
] as const

/** A hairline between two segments. Decorative, so it is hidden from the AT tree. */
const Divider: React.FC = () => (
  <span aria-hidden="true" className="h-8 w-px bg-[rgb(51_38_31_/_0.12)]" />
)

/**
 * The segmented search bar — the visual anchor of the header.
 *
 * Laid out with an explicit `grid-cols-[1fr_1px_1fr_1px_1fr_auto]` rather than
 * flex. The two dividers are 1px columns, which is what keeps them from being
 * squeezed to nothing or stretched as flex items when a segment's text grows.
 *
 * Inert, like the rest of this page: the segments are buttons with no handlers
 * so the markup already has the right shape when filtering is implemented.
 */
export const SearchBar: React.FC = () => (
  <div
    aria-label="Filtros de búsqueda de cafés"
    className="grid w-full max-w-[680px] grid-cols-[1fr_1px_1fr_1px_1fr_auto] items-center gap-0 rounded-full border border-[rgb(51_38_31_/_0.14)] bg-cc-surface py-[7px] pl-3.5 pr-[9px] shadow-cc-search"
    role="search"
    style={{ minHeight: 68 }}
  >
    <SearchSegment label={SEGMENTS[0].label} value={SEGMENTS[0].value} />
    <Divider />
    <SearchSegment label={SEGMENTS[1].label} value={SEGMENTS[1].value} />
    <Divider />
    <SearchSegment label={SEGMENTS[2].label} value={SEGMENTS[2].value} />

    <button
      aria-label="Buscar cafés"
      className="grid h-[46px] w-[46px] place-items-center rounded-full bg-cc-olive text-white transition-transform duration-200 hover:scale-105"
      type="button"
    >
      <svg
        fill="none"
        height="19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
        viewBox="0 0 24 24"
        width="19"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="M16 16l5 5" />
      </svg>
    </button>
  </div>
)
