/**
 * The cafés module's public surface, safe to import from anywhere.
 *
 * The Payload adapter is NOT here: it imports `@payload-config`, which drags
 * every collection and the database adapter into any bundle that touches it.
 * Server code imports `@/modules/cafes/server`.
 */
export {
  AMENITY_LABELS,
  AMENITY_ORDER,
  CAFE_CONCEPT_FILTERS,
  CAFE_ZONE_FILTERS,
  CAFES_PAGE_SIZE,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER
} from './domain/entities/Cafe'
export type {
  AmenityKey,
  AmenityState,
  CafeConceptFilter,
  CafeDetail,
  CafeId,
  CafePage,
  CafePriceFilter,
  CafeQuery,
  CafeSummary,
  CafeZoneFilter,
  MenuItem,
  OpeningHours,
  Weekday
} from './domain/entities/Cafe'
export { CAFE_ERROR_KIND, CafeError, type CafeErrorKind } from './domain/errors/CafeErrors'
export type { ICafeRepository } from './domain/repositories/ICafeRepository'
