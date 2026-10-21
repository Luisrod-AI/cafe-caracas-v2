import type { Metadata } from 'next'

import { SearchExperience } from '@/components/cafe-caracas/organisms/SearchExperience'
import {
  CAFE_CONCEPT_FILTERS,
  CAFE_ZONE_FILTERS,
  type CafeConceptFilter,
  type CafePriceFilter,
  type CafeZoneFilter,
} from '@/modules/cafes'
import { getCafeRepository } from '@/modules/cafes/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  description:
    'Busca cafés en Caracas por ubicación, ambiente, precio y servicios.',
  title: 'Buscar cafés en Caracas',
}

type SearchParams = {
  q?: string
  zone?: string
  concept?: string | string[]
  price?: string
}

type Props = {
  searchParams: Promise<SearchParams>
}

function getValidZone(value: string | undefined): CafeZoneFilter | undefined {
  if (!value) return undefined

  return CAFE_ZONE_FILTERS.includes(value as CafeZoneFilter)
    ? (value as CafeZoneFilter)
    : undefined
}

function getValidConcepts(
  value: string | string[] | undefined,
): CafeConceptFilter[] {
  if (!value) return []

  const values = Array.isArray(value) ? value : [value]

  return values.filter((item): item is CafeConceptFilter =>
    CAFE_CONCEPT_FILTERS.includes(item as CafeConceptFilter),
  )
}

function getValidPrice(value: string | undefined): CafePriceFilter | undefined {
  const validPrices: CafePriceFilter[] = [
    'under10',
    '10to20',
    '20to30',
    'over30',
  ]

  if (!value) return undefined

  return validPrices.includes(value as CafePriceFilter)
    ? (value as CafePriceFilter)
    : undefined
}

export default async function CafeSearchPage({ searchParams }: Props) {
  const params = await searchParams

  const search = params.q?.trim() || undefined
  const zone = getValidZone(params.zone)
  const concepts = getValidConcepts(params.concept)
  const price = getValidPrice(params.price)

  const cafes = await getCafeRepository().list({
    search,
    zone,
    concepts: concepts.length > 0 ? concepts : undefined,
    price,
  })

  return <SearchExperience cafes={cafes.results} />
}