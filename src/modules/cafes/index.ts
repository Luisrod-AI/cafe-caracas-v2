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
  CAFES_PAGE_SIZE,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from './domain/entities/Cafe'
export type {
  AmenityKey,
  AmenityState,
  CafeDetail,
  CafeId,
  CafePage,
  CafeQuery,
  CafeSummary,
  MenuItem,
  OpeningHours,
  Weekday,
} from './domain/entities/Cafe'
export type { ICafeRepository } from './domain/repositories/ICafeRepository'
export { CAFE_ERROR_KIND, CafeError, type CafeErrorKind } from './domain/errors/CafeErrors'
