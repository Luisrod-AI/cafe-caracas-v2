'use client'

import React, { useEffect, useState } from 'react'

import {
  getFavoriteSlugs,
  toggleFavorite,
} from '../lib/favorites'

type Props = {
  cafeSlug: string
  cafeName: string
  className?: string
}

export const FavoriteButton: React.FC<Props> = ({
  cafeSlug,
  cafeName,
  className,
}) => {
  const [favorite, setFavorite] = useState(false)

  useEffect(() => {
    const syncFavorite = () => {
      setFavorite(getFavoriteSlugs().includes(cafeSlug))
    }

    syncFavorite()

    window.addEventListener(
      'caracas-cafe-favorites-changed',
      syncFavorite,
    )

    return () => {
      window.removeEventListener(
        'caracas-cafe-favorites-changed',
        syncFavorite,
      )
    }
  }, [cafeSlug])

  const handleClick = () => {
    const nextFavorite = toggleFavorite(cafeSlug)
    setFavorite(nextFavorite)
  }

  return (
    <button
      aria-label={
        favorite
          ? `Quitar ${cafeName} de favoritos`
          : `Agregar ${cafeName} a favoritos`
      }
      aria-pressed={favorite}
      className={`${
        className ?? 'absolute right-3 top-3 z-20'
      } grid h-10 w-10 place-items-center rounded-full border border-white/70 backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cc-olive focus-visible:ring-offset-2 ${
        favorite
          ? 'scale-105 bg-cc-olive text-white'
          : 'bg-white/90 text-cc-olive hover:scale-105 hover:bg-white'
      }`}
      onClick={handleClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className="text-[20px] leading-none"
      >
        {favorite ? '♥' : '♡'}
      </span>
    </button>
  )
}
