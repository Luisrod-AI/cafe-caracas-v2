import type { Cafe, Media } from '@/payload-types'

/**
 * The wire contract.
 *
 * The only file in the module allowed to import `@/payload-types`. Expressed as
 * views over the generated types rather than hand-copied, so a field removed
 * from the collection stops compiling here instead of reaching a component as
 * `undefined`.
 */

export type CafeDto = Cafe

/** The subset `list()` selects. Everything else is detail-page weight. */
export const CAFE_LIST_FIELDS = [
  'id',
  'name',
  'slug',
  'rate',
  'cost',
  'category',
  'notes',
  'municipality',
  'branch',
  'zone',
  'image',
  'imageUrl',
] as const

export type CafeListItemDto = Pick<Cafe, 'id' | 'name' | 'slug'> &
  Partial<
    Pick<
      Cafe,
      | 'branch'
      | 'category'
      | 'cost'
      | 'image'
      | 'imageUrl'
      | 'municipality'
      | 'notes'
      | 'rate'
      | 'zone'
    >
  >

/** Relationships arrive as an id or as the expanded document, per `depth`. */
export type MediaRef = number | string | Media | null | undefined

/** True when a relationship came back expanded rather than as an id. */
export function isExpandedMedia(ref: MediaRef): ref is Media {
  return typeof ref === 'object' && ref !== null
}
