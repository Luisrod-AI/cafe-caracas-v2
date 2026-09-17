import type { CafeDetail, CafePage, CafeQuery } from '../entities/Cafe'

/**
 * The port.
 *
 * The only thing the presentation layer knows about how café data is obtained.
 * Implemented over Payload's Local API for server rendering; a REST adapter can
 * be added beside it without any page changing.
 */
export interface ICafeRepository {
  /** One page of the directory grid. */
  list(query: CafeQuery): Promise<CafePage>

  /**
   * A café by its URL slug, or `null` when there is none.
   *
   * `null` rather than a thrown error: "no café at this slug" is an ordinary
   * outcome the page turns into a 404, not a failure of the call.
   */
  getBySlug(slug: string): Promise<CafeDetail | null>
}
