import { sqliteAdapter } from '@payloadcms/db-sqlite'

/**
 * One adapter, two destinations.
 *
 * Both development and production speak SQLite through libSQL, so there is a
 * single code path here: only the connection details change.
 *
 * - `file:` URLs are a local file. That is the development database.
 * - `libsql://` (or `https://`) URLs are a remote Turso database. That is
 *   production, and it additionally requires an auth token.
 */
const DEFAULT_LOCAL_URL = 'file:./cafe-caracas.db'

const url = process.env.DATABASE_URL || DEFAULT_LOCAL_URL

/**
 * A remote database is anything that is not a local file.
 *
 * The distinction drives two separate decisions below — the auth token and the
 * schema push — so it is computed once and named, rather than re-tested at each
 * site with a slightly different string check.
 */
export const isRemoteDatabase = !url.startsWith('file:')

if (isRemoteDatabase && !process.env.DATABASE_AUTH_TOKEN) {
  throw new Error(
    `DATABASE_URL points at a remote database (${url}) but DATABASE_AUTH_TOKEN is not set. ` +
      'Turso rejects unauthenticated connections, and the resulting failure surfaces as an ' +
      'opaque error at the first query rather than at startup.',
  )
}

export const databaseAdapter = sqliteAdapter({
  client: {
    url,
    // Only sent for remote databases: libSQL rejects a token alongside a `file:` URL.
    ...(isRemoteDatabase ? { authToken: process.env.DATABASE_AUTH_TOKEN } : {}),
  },
  /**
   * Drizzle's dev push writes schema changes straight into the database at
   * runtime. That is convenient against a local file you can delete, and
   * dangerous against a shared remote one, so it is tied to the destination and
   * not to NODE_ENV — running `pnpm dev` with a Turso URL must not push either.
   *
   * With push off, schema changes reach Turso only through migrations generated
   * by `payload migrate:create` and applied by `payload migrate` before deploy.
   */
  push: !isRemoteDatabase,
})
