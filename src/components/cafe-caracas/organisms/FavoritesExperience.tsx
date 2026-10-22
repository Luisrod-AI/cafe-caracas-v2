'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import type { CafeSummary } from '@/modules/cafes'

import { getFavoriteSlugs } from '../lib/favorites'
import { Brand } from '../molecules/Brand'
import { CafeCard } from '../molecules/CafeCard'

type Props = {
  cafes: CafeSummary[]
}

export const FavoritesExperience: React.FC<Props> = ({
  cafes,
}) => {
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([])

  useEffect(() => {
    const syncFavorites = () => {
      setFavoriteSlugs(getFavoriteSlugs())
    }

    syncFavorites()

    window.addEventListener(
      'caracas-cafe-favorites-changed',
      syncFavorites,
    )

    return () => {
      window.removeEventListener(
        'caracas-cafe-favorites-changed',
        syncFavorites,
      )
    }
  }, [])

  const favoriteCafes = cafes.filter((cafe) =>
    favoriteSlugs.includes(cafe.slug),
  )

  return (
    <div className="cc-page-transition min-h-screen bg-cc-page text-cc-ink-strong">
      <header className="border-b border-black/10 bg-cc-header px-7 py-4 shadow-cc-header">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6">
          <Brand />

          <Link
            className="inline-flex min-h-11 items-center rounded-full border border-black/10 bg-cc-surface px-5 text-[13px] font-semibold text-cc-olive transition-colors hover:border-cc-olive"
            href="/cafe-caracas/search"
          >
            ← Volver a explorar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-7 pb-20 pt-10">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cc-muted">
            Mi selección
          </span>

          <h1 className="mt-2 font-serif text-[42px] leading-tight">
            Cafés favoritos
          </h1>

          <p className="mt-2 text-sm text-cc-muted">
            {favoriteCafes.length === 1
              ? '1 café guardado'
              : `${favoriteCafes.length} cafés guardados`}
          </p>
        </div>

        {favoriteCafes.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-[18px] gap-y-[30px] max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">
            {favoriteCafes.map((cafe, index) => (
              <CafeCard
                cafe={cafe}
                key={cafe.slug}
                priority={index < 3}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] border border-black/10 bg-cc-surface px-8 py-16 text-center">
            <h2 className="font-serif text-[32px]">
              Todavía no tienes favoritos
            </h2>

            <p className="mx-auto mt-3 max-w-md leading-7 text-cc-muted">
              Guarda los cafés que quieras visitar y aparecerán aquí.
            </p>

            <Link
              className="mt-7 inline-flex rounded-full bg-cc-olive px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
              href="/cafe-caracas/search"
            >
              Explorar cafés
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}