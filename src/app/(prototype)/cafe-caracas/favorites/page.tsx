import type { Metadata } from 'next'

import { FavoritesExperience } from '@/components/cafe-caracas/organisms/FavoritesExperience'
import { getCafeRepository } from '@/modules/cafes/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  description:
    'Guarda y consulta tus cafés favoritos de Caracas.',
  title: 'Mis cafés favoritos',
}

export default async function FavoritesPage() {
  const cafes = await getCafeRepository().list({})

  return <FavoritesExperience cafes={cafes.results} />
}