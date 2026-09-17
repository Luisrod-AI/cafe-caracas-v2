import 'server-only'

import type { ICafeRepository } from './domain/repositories/ICafeRepository'
import { PayloadLocalCafeRepository } from './infrastructure/repositories/PayloadLocalCafeRepository'

/**
 * The cafés module's server-side surface.
 *
 * `import 'server-only'` makes the boundary mechanical: importing this from a
 * client component fails the build with a clear message instead of silently
 * shipping the whole Payload config to the browser.
 */
export * from './index'

/**
 * A function rather than a module-level instance: on Workers an isolate is
 * reused across invocations, so anything holding request state at module scope
 * leaks between visitors.
 */
export function getCafeRepository(): ICafeRepository {
  return new PayloadLocalCafeRepository()
}
