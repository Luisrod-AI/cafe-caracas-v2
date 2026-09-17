/**
 * Every failure that leaves the catalog module wears this type.
 *
 * Without it the caller has to guess: a dropped connection, a 403 and a
 * response whose shape changed all arrive as different exception types from
 * different layers, and the page ends up catching `unknown` and rendering the
 * same blank state for all three.
 */

export const CATALOG_ERROR_KIND = {
  /** The request never got an answer — network, timeout, worker limit. */
  UNREACHABLE: 'unreachable',
  /** The caller is not allowed to read this. */
  FORBIDDEN: 'forbidden',
  /** The server answered, but not with the shape the adapter expects. */
  CONTRACT: 'contract',
  /** Anything else, kept so nothing is silently swallowed. */
  UNKNOWN: 'unknown',
} as const

export type CatalogErrorKind = (typeof CATALOG_ERROR_KIND)[keyof typeof CATALOG_ERROR_KIND]

export class CatalogError extends Error {
  readonly kind: CatalogErrorKind

  /** The original failure, kept for logging — never for control flow. */
  readonly cause?: unknown

  constructor(kind: CatalogErrorKind, message: string, cause?: unknown) {
    super(message)
    this.name = 'CatalogError'
    this.kind = kind
    this.cause = cause
  }
}
