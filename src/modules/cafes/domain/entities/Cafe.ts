/**
 * The café directory, as the storefront understands it.
 *
 * Imports nothing — not `payload`, not `@/payload-types`, not React. The shapes
 * here are chosen by what the two views render, which is why the grid gets a
 * narrow `CafeSummary` and the detail page a wider `CafeDetail` instead of both
 * sharing one type with half its fields unused.
 */

export type CafeId = string

/** A single day's opening window. `null` means closed that day. */
export interface OpeningHours {
  open: string
  close: string
}

export const WEEKDAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAY_ORDER)[number]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  friday: 'Viernes',
  monday: 'Lunes',
  saturday: 'Sábado',
  sunday: 'Domingo',
  thursday: 'Jueves',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
}

/**
 * What the grid cell renders. Deliberately narrow — carrying hours, sources and
 * coordinates into a 110-row list means paying for them 110 times.
 */
export interface CafeSummary {
  id: CafeId
  slug: string
  name: string
  /** Municipality, branch or zone — whichever the record had. */
  zone: string
  /** `null` when unrated. The card shows "N/A", never 0. */
  rating: number | null
  /** `null` when unpriced. The card shows "Precio por verificar". */
  price: string | null
  /** At most two, mirroring the prototype's own truncation. */
  tags: string[]
  imageUrl: string | null
}

/** One dish in the featured menu. */
export interface MenuItem {
  name: string
  /** Free text: the source carries "$5.00", "5-10$" and blanks alike. */
  price: string | null
  imageUrl: string | null
}

/**
 * The eight amenity flags, in the order the detail page lists them.
 *
 * `unknown` is a real state and not a synonym for `no`: it means nobody has
 * checked. The view shows only the `yes` ones, so collapsing the two would
 * advertise services a café may not have.
 */
export const AMENITY_ORDER = [
  'wifi',
  'coworking',
  'cozy',
  'terrace',
  'petFriendly',
  'parking',
  'brunch',
  'sightseeing',
] as const

export type AmenityKey = (typeof AMENITY_ORDER)[number]

export type AmenityState = 'no' | 'unknown' | 'yes'

export const AMENITY_LABELS: Record<AmenityKey, string> = {
  brunch: 'Brunch',
  coworking: 'Coworking',
  cozy: 'Acogedor',
  parking: 'Estacionamiento',
  petFriendly: 'Pet friendly',
  sightseeing: 'Con vista',
  terrace: 'Terraza',
  wifi: 'WiFi',
}

/** Everything the detail page renders, summary included. */
export interface CafeDetail extends CafeSummary {
  /** The full category string, split for the eyebrow — e.g. "Bar / rooftop". */
  categories: string[]
  neighborhood: string | null
  municipality: string | null
  notes: string | null
  /** Absolute Google Maps URL, or `null` when the record has none. */
  mapUrl: string | null
  website: string | null
  instagram: string | null
  /** Missing days are closed; an empty object means no schedule is known. */
  hours: Partial<Record<Weekday, OpeningHours>>
  /** Only set when the record is flagged as having exact coordinates. */
  coordinates: { latitude: number; longitude: number } | null
  /**
   * `true` when the café has no schedule at all. The view then says "Horario
   * por verificar" for every day instead of "Cerrado" — one means nobody
   * checked, the other means the café is shut, and they are different facts.
   */
  hoursUnknown: boolean
  /** Only the amenities confirmed present. */
  amenities: AmenityKey[]
  menu: MenuItem[]
  /** "La Trinidad · Baruta · Caracas", assembled from what the record has. */
  address: string
}

export interface CafePage {
  results: CafeSummary[]
  totalDocs: number
  hasNextPage: boolean
}

export interface CafeQuery {
  search?: string
  zone?: string
  limit?: number
  page?: number
}

/** The grid asks for everything; the CMS default of 10 would show ten cafés. */
export const CAFES_PAGE_SIZE = 200
