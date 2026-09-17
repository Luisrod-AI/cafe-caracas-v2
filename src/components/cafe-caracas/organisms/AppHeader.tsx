import React from 'react'

import { Brand } from '../molecules/Brand'
import { CategoryNav } from '../molecules/CategoryNav'
import { FavoritesLink } from '../molecules/FavoritesLink'
import { SearchBar } from '../molecules/SearchBar'

/**
 * The sticky cream band: brand, search, favourites, categories.
 *
 * From 1250px up, the search bar is centred on the PAGE — taken out of flow and
 * pinned to the horizontal midpoint — with the brand at the left edge and the
 * favourites pill at the right, both also out of flow.
 *
 * A grid of `[220px 1fr]` looks equivalent and is not: the search then centres
 * inside the second column, which begins 220px from the left. The offset is
 * invisible at 1280px and obvious on a wide monitor, where the whole bar drifts
 * right of centre. Only the brand and the pill know their own edges; the search
 * has to measure against the page.
 *
 * Below 1250px everything returns to the flow and stacks — out-of-flow
 * positioning only works while there is room for it, and kept at narrow widths
 * the three elements land on top of each other. The prototype swaps in a
 * separate compact search control at this point; that variant is not built
 * here, so this degrades rather than imitating it.
 *
 * The 14px/12px vertical padding is measured, not rounded: the prototype uses
 * 8px/6px at narrow widths and 14px/12px from desktop up.
 */
export const AppHeader: React.FC = () => (
  <header className="sticky top-0 z-30 bg-cc-header pb-3 pt-3.5 shadow-cc-header">
    <div className="relative mx-6 flex flex-col items-center gap-3 min-[1250px]:block min-[1250px]:min-h-[78px]">
      {/* ── below 1250px: brand and favourites share a row ─────────────── */}
      <div className="flex w-full items-center justify-between gap-4 min-[1250px]:hidden">
        <Brand />
        <FavoritesLink />
      </div>

      {/* ── from 1250px: each element pinned to its own anchor ──────────── */}
      <div className="absolute left-0 top-1/2 hidden -translate-y-1/2 min-[1250px]:block">
        <Brand />
      </div>

      {/* The width is explicit once this is out of flow: an absolutely
          positioned box sizes to its content, so the bar's own `w-full` would
          have nothing to resolve against. */}
      <div className="flex w-full justify-center min-[1250px]:absolute min-[1250px]:left-1/2 min-[1250px]:top-1/2 min-[1250px]:w-[680px] min-[1250px]:-translate-x-1/2 min-[1250px]:-translate-y-1/2">
        <SearchBar />
      </div>

      <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 min-[1250px]:block">
        <FavoritesLink />
      </div>
    </div>

    <CategoryNav />
  </header>
)
