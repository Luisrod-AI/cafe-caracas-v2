'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { SearchSegment } from '../atoms/SearchSegment'


type FilterType = 'zone' | 'concept' | 'price' | null

const ZONE_OPTIONS = [
  { label: 'Centro', value: 'centro' },
  { label: 'Este', value: 'este' },
  { label: 'Oeste', value: 'oeste' },
] as const

const CONCEPT_OPTIONS = [
  { label: 'Para trabajar', value: 'work' },
  { label: 'Terraza', value: 'terrace' },
  { label: 'Café de especialidad', value: 'specialtyCoffee' },
  { label: 'Pet friendly', value: 'petFriendly' },
  { label: 'Estacionamiento', value: 'parking' },
  { label: 'Brunch', value: 'brunch' },
  { label: 'Aire libre', value: 'outdoor' },
  { label: 'Para pasar el rato', value: 'cozy' },
] as const

const PRICE_OPTIONS = [
  { label: 'Hasta $10', value: 'under10' },
  { label: '$10 – $20', value: '10to20' },
  { label: '$20 – $30', value: '20to30' },
  { label: 'Más de $30', value: 'over30' },
] as const

const Divider: React.FC = () => (
  <span
    aria-hidden="true"
    className="h-8 w-px shrink-0 bg-[rgb(51_38_31_/_0.12)]"
  />
)

type Option = {
  label: string
  value: string
}

type DropdownProps = {
  options: readonly Option[]
  selectedValue: string | null
  onSelect: (value: string, label: string) => void
  columns?: 1 | 2
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  columns = 1,
}) => (
  <div
    className={`absolute left-0 top-[calc(100%+10px)] z-50 rounded-2xl border border-black/[0.06] bg-cc-surface p-2.5 shadow-[0_14px_35px_rgba(51,38,31,0.14)] ${
      columns === 2
        ? 'w-[360px]'
        : 'w-[210px]'
    }`}
  >
    <div
      className={
        columns === 2
          ? 'grid grid-cols-2 gap-1.5'
          : 'flex flex-col gap-1'
      }
    >
      {options.map((option) => {
        const selected = selectedValue === option.value

        return (
          <button
            className={`flex min-h-[38px] items-center rounded-xl px-3 py-2 text-left text-sm transition-all duration-150 ${
              selected
                ? 'bg-cc-olive text-white shadow-sm'
                : 'text-cc-ink-strong hover:bg-cc-olive/10 hover:text-cc-olive'
            }`}
            key={option.value}
            onClick={() => onSelect(option.value, option.label)}
            type="button"
          >
            <span className="flex-1">
              {option.label}
            </span>

            {selected && (
              <span
                aria-hidden="true"
                className="ml-2 text-xs"
              >
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  </div>
)

export const SearchBar: React.FC = () => {
    const router = useRouter()
  const [openFilter, setOpenFilter] =
    useState<FilterType>(null)

  const [selectedZone, setSelectedZone] =
    useState<string | null>(null)

  const [selectedConcept, setSelectedConcept] =
    useState<string | null>(null)

  const [selectedPrice, setSelectedPrice] =
    useState<string | null>(null)

  const [zoneLabel, setZoneLabel] =
    useState('Todas las zonas')

  const [conceptLabel, setConceptLabel] =
    useState('¿Cómo es el café?')

  const [priceLabel, setPriceLabel] =
    useState('¿Cuánto deseas gastar?')

  const handleSelect = (
    filter: Exclude<FilterType, null>,
    value: string,
    label: string,
  ) => {
    if (filter === 'zone') {
      setSelectedZone(value)
      setZoneLabel(label)
    }

    if (filter === 'concept') {
      setSelectedConcept(value)
      setConceptLabel(label)
    }

    if (filter === 'price') {
      setSelectedPrice(value)
      setPriceLabel(label)
    }

    setOpenFilter(null)
  }

    const handleSearch = () => {
    const params = new URLSearchParams()

    if (selectedZone) {
      params.set('zone', selectedZone)
    }

    if (selectedConcept) {
      params.set('concept', selectedConcept)
    }

    if (selectedPrice) {
      params.set('price', selectedPrice)
    }

    const query = params.toString()

    router.push(
      query
        ? `/cafe-caracas/search?${query}`
        : '/cafe-caracas/search',
    )
  }

  return (
    <div className="relative w-full max-w-[680px]">
      <div
        aria-label="Filtros de búsqueda de cafés"
        className="grid min-h-[68px] w-full grid-cols-[1fr_1px_1fr_1px_1fr_auto] items-center gap-0 rounded-full border border-[rgb(51_38_31_/_0.14)] bg-cc-surface py-[7px] pl-3.5 pr-[9px] shadow-cc-search"
        role="search"
      >
        <div className="relative min-w-0">
          <SearchSegment
            isOpen={openFilter === 'zone'}
            label="Zona"
            onClick={() =>
              setOpenFilter(
                openFilter === 'zone'
                  ? null
                  : 'zone',
              )
            }
            value={zoneLabel}
          />

          {openFilter === 'zone' && (
            <Dropdown
              onSelect={(value, label) =>
                handleSelect('zone', value, label)
              }
              options={ZONE_OPTIONS}
              selectedValue={selectedZone}
            />
          )}
        </div>

        <Divider />

        <div className="relative min-w-0">
          <SearchSegment
            isOpen={openFilter === 'concept'}
            label="Concepto"
            onClick={() =>
              setOpenFilter(
                openFilter === 'concept'
                  ? null
                  : 'concept',
              )
            }
            value={conceptLabel}
          />

          {openFilter === 'concept' && (
            <Dropdown
              columns={2}
              onSelect={(value, label) =>
                handleSelect(
                  'concept',
                  value,
                  label,
                )
              }
              options={CONCEPT_OPTIONS}
              selectedValue={selectedConcept}
            />
          )}
        </div>

        <Divider />

        <div className="relative min-w-0">
          <SearchSegment
            isOpen={openFilter === 'price'}
            label="Precio"
            onClick={() =>
              setOpenFilter(
                openFilter === 'price'
                  ? null
                  : 'price',
              )
            }
            value={priceLabel}
          />

          {openFilter === 'price' && (
            <Dropdown
              onSelect={(value, label) =>
                handleSelect('price', value, label)
              }
              options={PRICE_OPTIONS}
              selectedValue={selectedPrice}
            />
          )}
        </div>

        <button
          aria-label="Buscar cafés"
          className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-cc-olive text-white transition-transform duration-200 hover:scale-105"
          onClick={handleSearch}
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
            <circle
              cx="10.5"
              cy="10.5"
              r="7"
            />
            <path d="M16 16l5 5" />
          </svg>
        </button>
      </div>
    </div>
  )
}