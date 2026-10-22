'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

import type { CafeSummary } from '@/modules/cafes'
import dynamic from 'next/dynamic'
import { Brand } from '../molecules/Brand'
import { CafeCard } from '../molecules/CafeCard'
import { FavoritesLink } from '../molecules/FavoritesLink'


const CafeMap = dynamic(
  () => import('./CafeMap').then((mod) => mod.CafeMap),
  {
    ssr: false,
  },
)

type Props = {
  cafes: CafeSummary[]
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadiusKm = 6371

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}


export const SearchExperience: React.FC<Props> = ({ cafes }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const navigateWithParams = (params: URLSearchParams) => {
  setIsFiltering(true)

  const query = params.toString()
  router.push(query ? `${pathname}?${query}` : pathname)
}

const filterStateKey = searchParams.toString()

const selectedZone = searchParams.get('zone')
const selectedConcepts = searchParams.getAll('concept')
const selectedPrice = searchParams.get('price')
const selectedSearch = searchParams.get('q') ?? ''

const [locationEnabled, setLocationEnabled] = useState(false)
const [searchInput, setSearchInput] = useState(selectedSearch)
const [showZoneMenu, setShowZoneMenu] = useState(false)
const [visibleCafeCount, setVisibleCafeCount] = useState(8)
const [selectedCafe, setSelectedCafe] =
  useState<CafeSummary | null>(null)
const [isFiltering, setIsFiltering] = useState(false)


useEffect(() => {
  setVisibleCafeCount(8)
}, [filterStateKey])

useEffect(() => {
  setSearchInput(selectedSearch)
}, [selectedSearch])

useEffect(() => {
  if (!isFiltering) {
    return
  }

  const timeout = window.setTimeout(() => {
    setIsFiltering(false)
  }, 350)

  return () => {
    window.clearTimeout(timeout)
  }
}, [filterStateKey, isFiltering])

  const zoneButtonRef = useRef<HTMLButtonElement>(null)
const zoneMenuRef = useRef<HTMLDivElement>(null)

const [showPriceMenu, setShowPriceMenu] = useState(false)

const priceButtonRef = useRef<HTMLButtonElement>(null)
const priceMenuRef = useRef<HTMLDivElement>(null)

  const [priceMenuPosition, setPriceMenuPosition] = useState({
  top: 0,
  left: 0,
})

  const [zoneMenuPosition, setZoneMenuPosition] = useState({
    top: 0,
    left: 0,
  })

  useEffect(() => {
  const updateMenuPositions = () => {
    if (showZoneMenu && zoneButtonRef.current) {
      const rect = zoneButtonRef.current.getBoundingClientRect()

      setZoneMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }

    if (showPriceMenu && priceButtonRef.current) {
      const rect = priceButtonRef.current.getBoundingClientRect()

      setPriceMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
  }

  if (!showZoneMenu && !showPriceMenu) {
    return
  }

  updateMenuPositions()

  window.addEventListener('resize', updateMenuPositions)
  window.addEventListener('scroll', updateMenuPositions, true)

  return () => {
    window.removeEventListener('resize', updateMenuPositions)
    window.removeEventListener('scroll', updateMenuPositions, true)
  }
}, [showZoneMenu, showPriceMenu])

useEffect(() => {
  if (!showZoneMenu && !showPriceMenu) {
    return
  }

  const handleOutsidePointerDown = (event: PointerEvent) => {
    const target = event.target as Node

    const clickedZoneButton =
      zoneButtonRef.current?.contains(target) ?? false

    const clickedZoneMenu =
      zoneMenuRef.current?.contains(target) ?? false

    const clickedPriceButton =
      priceButtonRef.current?.contains(target) ?? false

    const clickedPriceMenu =
      priceMenuRef.current?.contains(target) ?? false

    if (
      !clickedZoneButton &&
      !clickedZoneMenu &&
      !clickedPriceButton &&
      !clickedPriceMenu
    ) {
      setShowZoneMenu(false)
      setShowPriceMenu(false)
    }
  }

  document.addEventListener(
    'pointerdown',
    handleOutsidePointerDown,
  )

  return () => {
    document.removeEventListener(
      'pointerdown',
      handleOutsidePointerDown,
    )
  }
}, [showZoneMenu, showPriceMenu])


  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState(false)

  const handleCafeSelect = (cafe: CafeSummary) => {
  setSelectedCafe(cafe)
}

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

  navigateWithParams(params)
  }

  const toggleConcept = (concept: string) => {
  const params = new URLSearchParams(searchParams.toString())
  const concepts = params.getAll('concept')

  if (concepts.includes(concept)) {
    params.delete('concept')

    concepts
      .filter((item) => item !== concept)
      .forEach((item) => params.append('concept', item))
  } else {
    params.append('concept', concept)
  }

  navigateWithParams(params)
}

const clearAllFilters = () => {
  navigateWithParams(new URLSearchParams())
}

const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  const params = new URLSearchParams(searchParams.toString())
  const value = searchInput.trim()

  if (value) {
    params.set('q', value)
  } else {
    params.delete('q')
  }

  navigateWithParams(params)
}

  const zoneLabels: Record<string, string> = {
    centro: 'Centro',
    este: 'Este',
    oeste: 'Oeste',
  }

  const conceptLabels: Record<string, string> = {
    work: 'Para trabajar',
    cozy: 'Para pasar el rato',
    terrace: 'Terraza',
    specialtyCoffee: 'Café de especialidad',
    petFriendly: 'Pet friendly',
    parking: 'Estacionamiento',
    brunch: 'Brunch',
    outdoor: 'Aire libre',
    sightseeing: 'Con vista',
  }

  const priceLabels: Record<string, string> = {
    under10: 'Hasta $10',
    '10to20': '$10–20',
    '20to30': '$20–30',
    over30: 'Más de $30',
  }

  const ALL_FILTERS = [
  { key: 'all', label: 'Todos', type: 'all' },
  { key: 'zone', label: 'Zona', type: 'zone' },
  { key: 'price', label: 'Precio', type: 'price' },
  { key: 'work', label: 'Para trabajar', type: 'concept' },
  { key: 'sightseeing', label: 'Con vista', type: 'concept' },
  { key: 'terrace', label: 'Terraza', type: 'concept' },
  { key: 'cozy', label: 'Para pasar el rato', type: 'concept' },
  { key: 'specialtyCoffee', label: 'Café de especialidad', type: 'concept' },
  { key: 'petFriendly', label: 'Pet friendly', type: 'concept' },
  { key: 'parking', label: 'Estacionamiento', type: 'concept' },
  { key: 'brunch', label: 'Brunch', type: 'concept' },
  { key: 'outdoor', label: 'Aire libre', type: 'concept' },
] as const

  const nearbyCafes = userLocation
    ? cafes
        .filter((cafe) => cafe.coordinates)
        .map((cafe) => ({
          cafe,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            cafe.coordinates!.latitude,
            cafe.coordinates!.longitude,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6)
    : []

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
      setLocationError(true)
      return
    }

    setLocationLoading(true)
    setLocationError(false)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })

        setLocationEnabled(true)
        setLocationLoading(false)
      },
      () => {
        setLocationEnabled(false)
        setLocationLoading(false)
        setLocationError(true)
      },
    )
  }

  return (
    <div className="min-h-screen bg-cc-page text-cc-ink-strong">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-black/10 bg-cc-page/95 px-7 pb-3.5 pt-[18px] backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[280px_minmax(520px,760px)_280px] items-center gap-7 max-[1100px]:grid-cols-1">
          <div className="justify-self-start">
            <Brand />
          </div>

          <form
  className="flex min-h-[62px] w-full items-center rounded-full border border-black/15 bg-cc-surface py-2 pl-[22px] pr-2.5 shadow-cc-search"
  onSubmit={handleSearchSubmit}
>
  <input
  className="w-full bg-transparent text-base placeholder:text-cc-muted-soft"
  inputMode="search"
  onChange={(event) => {
  const value = event.target.value

  setSearchInput(value)

  if (!value.trim() && selectedSearch) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    setSelectedCafe(null)
    navigateWithParams(params)
  }
}}
  placeholder="¿Qué café quieres descubrir hoy?"
  style={{
    appearance: 'none',
    WebkitAppearance: 'none',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
  }}
  type="text"
  value={searchInput}
/>

  <button
    aria-label="Buscar cafés"
    className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-cc-olive text-white transition hover:brightness-95"
    type="submit"
  >
    <svg
      fill="none"
      height="19"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
      width="19"
    >
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M16 16l5 5" />
    </svg>
  </button>
</form>

          <div className="justify-self-end max-[1100px]:hidden">
            <FavoritesLink />
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="mx-auto mt-4 w-full max-w-[1400px] px-2">
  <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto scrollbar-none max-[700px]:justify-start">
  {ALL_FILTERS.map((filter) => {
    if (filter.type === 'all') {
      const isActive =
        !selectedZone &&
        !selectedPrice &&
        selectedConcepts.length === 0

      return (
        <button
          aria-pressed={isActive}
          className={`shrink-0 rounded-full border px-4 py-[9px] text-[13px] font-medium transition-all duration-200 hover:-translate-y-[1px] hover:shadow-cc-pill active:translate-y-0 active:scale-[0.97] ${
            isActive
              ? 'border-cc-olive bg-cc-olive text-white shadow-sm'
              : 'border-black/10 bg-cc-surface text-cc-ink-strong hover:border-cc-olive hover:text-cc-olive'
          }`}
          key={filter.key}
          onClick={clearAllFilters}
          type="button"
        >
          Todos
        </button>
      )
    }

    if (filter.type === 'zone') {
      const isActive = Boolean(selectedZone)

      return (
        <button
  key={filter.key}
  ref={zoneButtonRef}
  aria-pressed={isActive}
  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.96] ${
    isActive
      ? 'border-cc-olive bg-cc-olive text-white shadow-sm'
      : 'border-black/10 bg-cc-surface text-cc-ink-strong hover:border-cc-olive hover:text-cc-olive'
  }`}
  onClick={() => {
    setShowZoneMenu((current) => !current)
    setShowPriceMenu(false)
  }}
  type="button"
>
          {selectedZone
            ? zoneLabels[selectedZone] ?? 'Zona'
            : 'Zona'}
          <span className="ml-1 text-xs">⌄</span>
        </button>
      )
    }

    if (filter.type === 'price') {
      const isActive = Boolean(selectedPrice)

      return (
        <button
  key={filter.key}
  ref={priceButtonRef}
  aria-pressed={isActive}
  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.96] ${
    isActive
      ? 'border-cc-olive bg-cc-olive text-white shadow-sm'
      : 'border-black/10 bg-cc-surface text-cc-ink-strong hover:border-cc-olive hover:text-cc-olive'
  }`}
  onClick={() => {
    setShowPriceMenu((current) => !current)
    setShowZoneMenu(false)
  }}
  type="button"
>
          {selectedPrice
            ? priceLabels[selectedPrice] ?? 'Precio'
            : 'Precio'}
          <span className="ml-1 text-xs">⌄</span>
        </button>
      )
    }

    const isActive = selectedConcepts.includes(filter.key)

    return (
      <button
        aria-pressed={isActive}
        className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.96] ${
          isActive
            ? 'border-cc-olive bg-cc-olive text-white shadow-sm'
            : 'border-black/10 bg-cc-surface text-cc-ink-strong hover:border-cc-olive hover:text-cc-olive'
        }`}
        key={filter.key}
        onClick={() => toggleConcept(filter.key)}
        type="button"
      >
        {filter.label}
      </button>
    )
    })}
</div>
</div>

        {/* ZONE DROPDOWN */}
        {typeof document !== 'undefined' &&
  createPortal(
    <div
      ref={zoneMenuRef}
      className={`fixed z-[100] w-48 origin-top-left overflow-hidden rounded-2xl border border-black/10 bg-cc-surface p-1.5 shadow-[0_14px_35px_rgb(51_38_31_/_0.14)] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        showZoneMenu
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none -translate-y-1 scale-[0.96] opacity-0'
      }`}
      style={{
        top: zoneMenuPosition.top,
        left: zoneMenuPosition.left,
      }}
    >
      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('zone', null)
          setShowZoneMenu(false)
        }}
        type="button"
      >
        Todas las zonas
      </button>

      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('zone', 'centro')
          setShowZoneMenu(false)
        }}
        type="button"
      >
        Centro
      </button>

      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('zone', 'este')
          setShowZoneMenu(false)
        }}
        type="button"
      >
        Este
      </button>

      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('zone', 'oeste')
          setShowZoneMenu(false)
        }}
        type="button"
      >
        Oeste
      </button>
    </div>,
    document.body,
  )}

          {typeof document !== 'undefined' &&
  createPortal(
    <div
      ref={priceMenuRef}
      className={`fixed z-[100] w-48 origin-top-left overflow-hidden rounded-2xl border border-black/10 bg-cc-surface p-1.5 shadow-[0_14px_35px_rgb(51_38_31_/_0.14)] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        showPriceMenu
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none -translate-y-1 scale-[0.96] opacity-0'
      }`}
      style={{
        top: priceMenuPosition.top,
        left: priceMenuPosition.left,
      }}
    >
      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('price', null)
          setShowPriceMenu(false)
        }}
        type="button"
      >
        Todos los precios
      </button>

      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('price', 'under10')
          setShowPriceMenu(false)
        }}
        type="button"
      >
        Hasta $10
      </button>

      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('price', '10to20')
          setShowPriceMenu(false)
        }}
        type="button"
      >
        $10–20
      </button>

      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('price', '20to30')
          setShowPriceMenu(false)
        }}
        type="button"
      >
        $20–30
      </button>

      <button
        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-cc-ink-strong transition-colors duration-150 hover:bg-black/5"
        onClick={() => {
          updateFilter('price', 'over30')
          setShowPriceMenu(false)
        }}
        type="button"
      >
        Más de $30
      </button>
    </div>,
    document.body,
  )}


      </header>

      {/* SEARCH BODY */}
      <main className="mx-auto grid min-h-[calc(100vh-130px)] w-full max-w-[1600px] grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] max-[1100px]:grid-cols-1">
        {/* LEFT SIDE */}
        <section className="min-w-0 px-[30px] pb-20 pt-[34px]">
          <div className="mb-9 flex items-end justify-between gap-6 max-[700px]:items-start max-[700px]:flex-col">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cc-muted">
                 {selectedSearch ? 'Búsqueda' : 'Descubre'}
              </span>

              <h1 className="mt-2 font-serif text-[clamp(42px,5vw,68px)] leading-[0.98]">
                {selectedSearch
                  ? `Resultados para “${selectedSearch}”`
                  : 'Cafés cerca de ti'}
              </h1>

              {(selectedZone ||
                selectedConcepts.length > 0 ||
                selectedPrice) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedZone && (
                    <span className="rounded-full bg-cc-olive px-3 py-1.5 text-sm font-medium text-white">
                      {zoneLabels[selectedZone] ?? selectedZone}
                    </span>
                  )}

                  {selectedConcepts.map((concept) => (
                    <span
                      className="rounded-full bg-cc-olive px-3 py-1.5 text-sm font-medium text-white"
                      key={concept}
                    >
                      {conceptLabels[concept] ?? concept}
                    </span>
                  ))}

                  {selectedPrice && (
                    <span className="rounded-full bg-cc-olive px-3 py-1.5 text-sm font-medium text-white">
                      {priceLabels[selectedPrice] ?? selectedPrice}
                    </span>
                  )}
                </div>
              )}

              <p className="mt-3.5 max-w-[560px] leading-7 text-cc-muted">
                {locationEnabled
                  ? 'Estamos mostrando cafés según tu ubicación actual.'
                  : locationError
                    ? 'No pudimos acceder a tu ubicación. Revisa los permisos del navegador e inténtalo de nuevo.'
                    : 'Activa tu ubicación para ver los cafés más cercanos.'}
              </p>
            </div>

            <button
              className={`shrink-0 rounded-full px-[18px] py-3 font-semibold transition ${
                locationEnabled
                  ? 'border border-cc-olive bg-cc-surface text-cc-olive'
                  : 'bg-cc-olive text-white'
              }`}
              disabled={locationLoading || locationEnabled}
              onClick={handleLocationRequest}
              type="button"
            >
              {locationLoading
                ? 'Obteniendo ubicación...'
                : locationEnabled
                  ? 'Ubicación activa ✓'
                  : 'Usar mi ubicación'}
            </button>
          </div>

          {/* NEARBY */}
          {locationEnabled && (
            <section>
              <div className="grid grid-cols-2 gap-x-[18px] gap-y-[26px] max-[700px]:grid-cols-1">
                {nearbyCafes.map(({ cafe }, index) => (
                  <CafeCard
                    cafe={cafe}
                    key={cafe.slug}
                    priority={index < 2}
                  />
                ))}
              </div>
            </section>
          )}

          {/* RECOMMENDED */}
          <section className="mt-12">
  {selectedCafe && (
    <button
      type="button"
      onClick={() => setSelectedCafe(null)}
      className="mb-4 text-sm font-semibold text-cc-olive transition hover:opacity-70"
    >
      ← Volver a todos los cafés
    </button>
  )}

  <div className="mb-5">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cc-muted">
      Para hoy
    </span>

              <h2 className="mt-2 font-serif text-[32px] leading-tight">
  {selectedCafe
    ? selectedCafe.name
    : selectedSearch
      ? 'Resultados de búsqueda'
      : selectedZone || selectedPrice || selectedConcepts.length > 0
        ? 'Cafés que coinciden'
        : 'Cafés recomendados'}
</h2>

              <p className="mt-2 text-sm text-cc-muted">
  {selectedCafe
    ? '1 café seleccionado'
    : cafes.length === 1
      ? '1 café encontrado'
      : `${cafes.length} cafés encontrados`}
</p>
            </div>

          {cafes.length > 0 ? (
  <>
    <div
  className={`grid grid-cols-3 gap-x-[18px] gap-y-[26px] transition-all duration-300 ${
    isFiltering
      ? 'translate-y-1 opacity-60'
      : 'translate-y-0 opacity-100'
  } max-[900px]:grid-cols-2 max-[700px]:grid-cols-1`}
>
  {(selectedCafe
    ? [selectedCafe]
    : cafes.slice(0, visibleCafeCount)
  ).map((cafe, index) => (
    <CafeCard
      cafe={cafe}
      key={cafe.slug}
      priority={index < 4}
    />
  ))}
</div>

    {!selectedCafe && visibleCafeCount < cafes.length && (
  <div className="mt-10 flex justify-center">
        <button
          className="rounded-full border border-cc-olive bg-cc-surface px-6 py-3 text-sm font-semibold text-cc-olive transition hover:bg-cc-olive hover:text-white"
          onClick={() =>
            setVisibleCafeCount((current) =>
              Math.min(current + 8, cafes.length),
            )
          }
          type="button"
        >
          Cargar más cafés
        </button>
      </div>
    )}
  </>
) : (
              <div className="rounded-3xl border border-black/10 bg-cc-surface px-8 py-12 text-center">
                <h3 className="font-serif text-3xl text-cc-ink-strong">
                  No encontramos cafés
                </h3>

                <p className="mx-auto mt-3 max-w-md leading-6 text-cc-muted">
                  No hay cafés que coincidan con los filtros seleccionados.
                  Prueba quitando algún filtro o buscando otra combinación.
                </p>
              </div>
            )}
          </section>
        </section>

        {/* MAP SIDE */}
<aside className="sticky top-[130px] h-[calc(100vh-130px)] min-w-0 p-[18px] pl-0 pb-[10px] max-[1100px]:static max-[1100px]:h-auto max-[1100px]:px-6 max-[1100px]:pb-8">
  <div className="h-full min-h-0 overflow-hidden rounded-[26px]">
    <CafeMap
      cafes={cafes}
      selectedCafeSlug={selectedCafe?.slug ?? null}
      onCafeSelect={handleCafeSelect}
    />
  </div>
</aside>
      </main>
    </div>
  )
}