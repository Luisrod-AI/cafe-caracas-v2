/**
 * Every failure that leaves the cafés module wears this type, so a page does
 * not have to tell a dropped connection apart from a changed response shape by
 * inspecting an `unknown`.
 */

export const CAFE_ERROR_KIND = {
  /** No answer — network, timeout, worker CPU limit. */
  UNREACHABLE: 'unreachable',
  /** Answered, denied. */
  FORBIDDEN: 'forbidden',
  /** Answered, wrong shape. */
  CONTRACT: 'contract',
  UNKNOWN: 'unknown',
} as const

export type CafeErrorKind = (typeof CAFE_ERROR_KIND)[keyof typeof CAFE_ERROR_KIND]

export class CafeError extends Error {
  readonly kind: CafeErrorKind

  /** The original failure, kept for logging — never for control flow. */
  readonly cause?: unknown

  constructor(kind: CafeErrorKind, message: string, cause?: unknown) {
    super(message)
    this.name = 'CafeError'
    this.kind = kind
    this.cause = cause
  }
}
