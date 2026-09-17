import { withPayload } from '@payloadcms/next/withPayload'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)
import { redirects } from './redirects'

/**
 * Makes Cloudflare bindings (R2, and anything added later) readable through
 * `getCloudflareContext()` during `next dev`, backed by a local simulation.
 * Without it the binding only exists in `preview` and `deploy`, so development
 * silently takes a different code path than production.
 */
void initOpenNextCloudflareForDev()

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const nextConfig: NextConfig = {
  // Temporarily required on Windows until Next.js fixes Turbopack Sass resolution.
  // See: https://github.com/vercel/next.js/issues/86431
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [90, 100],
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', '') as 'http' | 'https',
        }
      }),
      {
        /**
         * Photography for the /cafe-caracas prototype page, served from the
         * original static mock-up.
         *
         * TEMPORARY. It is scoped to the exact asset path rather than the whole
         * host so it cannot quietly become a general-purpose image proxy, and
         * it disappears the day those photos become Media documents.
         */
        hostname: 'luisrod-ai.github.io',
        pathname: '/cafe-caracas/assets/**',
        protocol: 'https',
      },
      /**
       * Menu photos, which the source sheet stores on Google Drive.
       *
       * Two entries rather than one `/**` because those are the only two paths
       * the data actually uses — 295 `/thumbnail` and 56 `/uc`. Opening the
       * whole host would turn our image optimiser into a general-purpose proxy
       * for anything on Drive.
       *
       * Also TEMPORARY: these become Media documents alongside the café photos.
       * Until then every menu thumbnail is fetched and re-encoded by the Worker,
       * which costs a request and some CPU per image.
       */
      {
        hostname: 'drive.google.com',
        pathname: '/thumbnail',
        protocol: 'https',
      },
      {
        hostname: 'drive.google.com',
        pathname: '/uc',
        protocol: 'https',
      },
    ],
  },
  reactStrictMode: true,
  redirects,
  /**
   * Keeps these out of Next's server bundle so the Worker bundler resolves them
   * itself.
   *
   * This is the whole reason Turso works here. `@libsql/client` ships
   * conditional exports: the `node` condition resolves to `lib-esm/node.js`,
   * which pulls in `sqlite3.js` and therefore `import Database from 'libsql'` —
   * a native `.node` binding that workerd cannot load. The `workerd` condition
   * resolves to `lib-esm/web.js`, which is fetch-only and has no such import.
   *
   * Next bundles with the `node` condition and would bake the wrong entry in
   * before the Cloudflare adapter ever sees the code. Marking the package
   * external defers resolution to the Worker build, where `workerd` wins.
   *
   * Verify after a build — the compiled worker must contain no reference to the
   * native client:
   *   rg -c "libsql/lib-esm/sqlite3|from ['\"]libsql['\"]" .open-next/worker.js
   */
  serverExternalPackages: ['@libsql/client', '@payloadcms/db-sqlite'],
  /**
   * Force-copy packages whose `workerd` entry point Next would otherwise leave
   * behind.
   *
   * Next's output file tracer resolves with the `node` condition and copies
   * only the files it traced. For a package with conditional exports that means
   * `node.mjs` is copied and `web.mjs` is not — so the Worker bundler later
   * finds the package's `package.json`, reads `"workerd": "./web.mjs"`, and
   * fails with "module not found on the file system".
   *
   * Including the whole package directory is the blunt but correct fix: the
   * tracer cannot know which condition the second bundler will apply.
   */
  outputFileTracingIncludes: {
    '**/*': [
      // Patterns must match FILES only. A trailing `/**` also matches nested
      // directories, and the tracer then tries to read one as a file and dies
      // with "Is a directory (os error 21)".
      //
      // Both layouts are covered on purpose: `node_modules/<pkg>` is the flat
      // one produced by `nodeLinker: hoisted`, and `node_modules/.pnpm/...` is
      // pnpm's nested default. Listing only one silently stops matching the day
      // the install strategy changes, and the build still succeeds — the
      // failure appears later as "module not found on the file system".
      './node_modules/@libsql/isomorphic-ws/*.mjs',
      './node_modules/@libsql/isomorphic-ws/*.cjs',
      './node_modules/jose/**/*.js',
      './node_modules/jose/**/*.mjs',
      './node_modules/jose/**/*.cjs',
      './node_modules/.pnpm/@libsql+isomorphic-ws@*/node_modules/@libsql/isomorphic-ws/*.mjs',
      './node_modules/.pnpm/@libsql+isomorphic-ws@*/node_modules/@libsql/isomorphic-ws/*.cjs',
      './node_modules/.pnpm/jose@*/node_modules/jose/**/*.js',
      './node_modules/.pnpm/jose@*/node_modules/jose/**/*.mjs',
      './node_modules/.pnpm/jose@*/node_modules/jose/**/*.cjs',
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig)
