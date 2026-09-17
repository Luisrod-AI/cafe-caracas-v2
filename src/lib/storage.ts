import { getCloudflareContext } from '@opennextjs/cloudflare'
import { r2Storage } from '@payloadcms/storage-r2'
import type { Plugin } from 'payload'

import { isWorkersRuntime } from './logger'

/**
 * Where uploaded files go.
 *
 * Workers has no writable filesystem, so the `staticDir` the Media collection
 * uses locally cannot exist in production — writes there fail at request time,
 * not at build time. R2 is the replacement.
 *
 * The binding is discovered rather than configured by an env flag: if a real R2
 * bucket is reachable we use it, otherwise we fall back to disk. That keeps
 * `pnpm dev` working with no Cloudflare setup at all, while `preview` and
 * `deploy` — which do expose the binding — pick up R2 without a second switch
 * to remember.
 */

/** Read off the plugin's own options so an upgrade cannot silently drift. */
type R2Bucket = Parameters<typeof r2Storage>[0]['bucket']

/**
 * Bindings via Wrangler's platform proxy, for everything that is not the
 * deployed Worker: `next build`, `next dev`, and the `payload` CLI.
 *
 * The import specifier is assembled at runtime instead of written literally so
 * that bundlers leave it alone. A literal `import('wrangler')` would drag the
 * entire CLI — and its Node-only dependencies — into the Worker bundle and fail
 * the build. Same trick the official Payload Cloudflare template uses.
 */
function getContextFromWrangler(): Promise<{ env: Record<string, unknown> }> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        // Reach the REAL bucket, so `generate:importmap` and any migration see
        // exactly what the deployed Worker will see.
        remoteBindings: true,
      }),
  )
}

async function findR2Bucket(): Promise<R2Bucket | null> {
  try {
    /**
     * Two ways to reach the same bindings, chosen by asking the RUNTIME what it
     * is — not by reading `NODE_ENV`.
     *
     * That distinction cost a deploy. `NODE_ENV` is `production` during
     * `next build` too, so keying on it sent the build down the Worker-only
     * path, where `getCloudflareContext` resolves to nothing. R2 came out
     * disabled, the upload endpoint was never registered, and every other check
     * still looked green — the only symptom was a 404 on
     * `/api/storage-r2-multi-part-upload`.
     *
     * `isWorkersRuntime` asks workerd directly, so it cannot be wrong about
     * where the code is actually executing.
     */
    const { env } = isWorkersRuntime
      ? await getCloudflareContext({ async: true })
      : await getContextFromWrangler()

    const bucket = (env as Record<string, unknown>)?.R2

    if (!bucket) {
      console.warn(
        `[storage] No R2 binding found (workerd=${isWorkersRuntime}). ` +
          'Uploads fall back to the filesystem, which does not exist on Workers.',
      )
      return null
    }

    return bucket as R2Bucket
  } catch (error) {
    // Loud on purpose: swallowing this is what hid a disabled R2 in production.
    console.warn(
      `[storage] Could not read Cloudflare bindings (workerd=${isWorkersRuntime}):`,
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

/**
 * The storage plugins: R2 when a bucket is bound, local disk otherwise.
 *
 * ⚠️ The import map is generated from THIS list at build time.
 *
 * `r2Storage` registers an admin component, `R2ClientUploadHandler`, and
 * `payload generate:importmap` discovers components by walking the config —
 * which is the only way the admin can resolve one at runtime. So the import map
 * must be generated in an environment where the plugin is present, or the admin
 * fails at runtime with:
 *
 *   getFromImportMap: PayloadComponent not found in importMap
 *
 * In practice that is handled: `next.config.ts` calls
 * `initOpenNextCloudflareForDev()`, which exposes a simulated R2 binding
 * locally, so `pnpm generate:importmap` sees the plugin and writes the entry.
 * If that ever stops being true, generate the map with the binding available
 * rather than making registration unconditional.
 */
export async function storagePlugins(): Promise<Plugin[]> {
  const bucket = await findR2Bucket()

  return [
    r2Storage({
      /**
       * Never read while `enabled` is false. The option is typed as required,
       * and the plugin has no "not configured yet" shape.
       */
      bucket: (bucket ?? {}) as R2Bucket,
      collections: {
        media: true,
      },
      /**
       * Registration is static, activation is dynamic — the distinction is the
       * whole point.
       *
       * R2 turns on ONLY inside workerd. Everywhere else uploads stay on disk in
       * the Media collection's `staticDir`, which is the same split the database
       * makes: a local file while you develop, the remote service in production.
       *
       * The workerd check is not redundant with the bucket check. Wrangler's
       * proxy hands the build and the CLI the REAL bucket on purpose — that is
       * what lets `generate:importmap` see this plugin — so "a bucket exists"
       * is true locally too. Without the runtime check, `pnpm dev` would write
       * straight into the production bucket.
       *
       * The plugin itself stays in the array either way: the import map is
       * generated from this list, and a conditionally-registered plugin is
       * missing from the map in exactly the environment that needs it.
       */
      enabled: isWorkersRuntime && Boolean(bucket),
      /**
       * The browser slices the file and uploads it in 5 MB parts.
       *
       * Correcting what an earlier version of this comment claimed: the file
       * does NOT bypass the Worker. Every part is POSTed to
       * `/api/storage-r2-multi-part-upload`, which is a Worker endpoint. What
       * changes is the SHAPE of the traffic — many bounded requests instead of
       * one unbounded body — so a large file cannot hit the Worker's request
       * body ceiling or spend its whole CPU budget in a single invocation.
       *
       * It is also what registers that endpoint at all, which is the only
       * externally observable proof that R2 is active: without it the plugin
       * can be enabled and there is no way to tell from outside.
       *
       * ⚠️ REQUIRES patches/@payloadcms__storage-r2@3.89.0.patch.
       *
       * Upstream 3.89.0 cannot run this feature at all. `R2ClientUploadHandler`
       * has TWO independent defects, and the second only becomes reachable once
       * the first is fixed.
       *
       * 1. `r2Storage` calls `initClientUploads` without
       *    `extraClientHandlerProps`, so the admin provider is mounted with
       *    `extra: undefined` — and the handler destructures
       *    `extra: { chunkSize = ... }` on its first line. Destructuring a
       *    property off `undefined` throws before the first `fetch`, so the
       *    network tab stays empty and the admin shows only a toast:
       *
       *      TypeError: Cannot read properties of undefined (reading 'chunkSize')
       *
       *    Patched by defaulting `extra` to `{}`.
       *
       * 2. The request URL is built ONCE, before `params` is mutated to carry
       *    `multipartId` / `multipartKey` / `multipartNumber`. `URLSearchParams`
       *    snapshots the object it is handed, so every later mutation is lost
       *    and all three requests go out with the create-upload query string.
       *
       *    The server therefore takes its "create multipart upload" branch every
       *    time: it opens three uploads, receives no parts, completes none, and
       *    answers the final request with JSON instead of the object key. The
       *    client stores that JSON blob as `clientUploadContext.key`, and
       *    `POST /api/media` then 500s trying to resolve a key that is really a
       *    serialised `{filename, key, uploadId}`.
       *
       *    Nothing ever reaches the bucket, yet all three POSTs log `Ok`.
       *    Patched by making the endpoint a function evaluated per request.
       *
       * Both are invisible in development: `enabled` is false outside workerd,
       * so the handler is never registered and uploads take the plain server
       * path. They can only appear in production.
       *
       * ⚠️ After changing this patch, delete `.next` before building. Next reuses
       * its module cache for `node_modules`, and a stale build silently emits
       * the OLD chunk under the SAME hash. Verify by diffing the hash of the
       * `9711-*.js` chunk, not by trusting a green build.
       */
      clientUploads: true,
    }),
  ]
}
