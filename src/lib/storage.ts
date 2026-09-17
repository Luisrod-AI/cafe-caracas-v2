import { getCloudflareContext } from '@opennextjs/cloudflare'
import { r2Storage } from '@payloadcms/storage-r2'
import type { Plugin } from 'payload'

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

async function findR2Bucket(): Promise<R2Bucket | null> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const bucket = (env as Record<string, unknown>).R2

    return (bucket as R2Bucket | undefined) ?? null
  } catch {
    // No Cloudflare context — a plain `next dev` run. Disk storage stands.
    return null
  }
}

/**
 * The storage plugins, with R2 switched on only when a bucket is bound.
 *
 * ⚠️ The plugin is ALWAYS in the array, even with no bucket. Do not "optimise"
 * this back into a conditional — that is a bug that blanks the entire admin
 * panel with no error in production, and this is why:
 *
 * `r2Storage` registers an admin component, `R2ClientUploadHandler`.
 * `payload generate:importmap` discovers components by walking the config at
 * BUILD time, and the import map it writes is the only way the admin can
 * resolve a component at RUNTIME. Building locally — where no R2 binding
 * exists — left the plugin out of the config, so the component never reached
 * the import map. On Cloudflare the binding does exist, the plugin activates,
 * Payload looks the component up, does not find it, and renders nothing:
 *
 *   getFromImportMap: PayloadComponent not found in importMap
 *   key: @payloadcms/storage-r2/client#R2ClientUploadHandler
 *
 * The failure surfaces only in the browser console, and only on the environment
 * that was not the one used to generate the map.
 *
 * So: registration is static, activation is dynamic. `enabled` is the switch
 * the plugin provides for exactly this.
 */
export async function storagePlugins(): Promise<Plugin[]> {
  const bucket = await findR2Bucket()

  return [
    r2Storage({
      /**
       * Never read while `enabled` is false. The cast exists because the option
       * is typed as required — the plugin has no "no bucket yet" shape, and the
       * alternative is leaving it out of the config entirely, which is the bug
       * described above.
       */
      bucket: (bucket ?? {}) as R2Bucket,
      collections: {
        media: true,
      },
      enabled: Boolean(bucket),
    }),
  ]
}
