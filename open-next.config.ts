import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'

export default defineCloudflareConfig({
  /**
   * Next's incremental cache normally lives on disk. Workers has no disk, so
   * without an override every ISR/`unstable_cache` read is a miss — including
   * the ones `getCachedGlobal` relies on for the header and footer.
   *
   * Requires an `NEXT_INC_CACHE_R2_BUCKET` binding in wrangler.jsonc.
   */
  incrementalCache: r2IncrementalCache,
})
