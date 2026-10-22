export const FAVORITES_STORAGE_KEY = 'caracas-cafe-favorites'

export function getFavoriteSlugs(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

export function isFavorite(slug: string): boolean {
  return getFavoriteSlugs().includes(slug)
}

export function toggleFavorite(slug: string): boolean {
  const current = getFavoriteSlugs()
  const exists = current.includes(slug)

  const next = exists
    ? current.filter((item) => item !== slug)
    : [...current, slug]

  window.localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(next),
  )

  window.dispatchEvent(new Event('caracas-cafe-favorites-changed'))

  return !exists
}