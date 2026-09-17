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
   * OFF everywhere, including local development.
   *
   * Drizzle's dev push runs on every `getPayload()` connect: it introspects the
   * database, diffs against the config and applies the difference. That works
   * on a database push itself created — and collides with one built by
   * migrations. It does not recognise the indexes the migrations already made,
   * so it reissues them and the connection dies:
   *
   *   SQLITE_ERROR: index payload_locked_documents_rels_order_idx already exists
   *
   * Which means the two cannot share a database. Keeping push for local and
   * migrations for production is what made the two schemas diverge in the first
   * place, and the divergence only surfaces on deploy.
   *
   * So there is ONE path now: `payload migrate:create` then `payload migrate`,
   * against local and against Turso alike. Changing a field costs one extra
   * command; in exchange, what you develop against is what ships.
   *
   * See docs/agregar-coleccion-payload.md.
   */
  push: false,
})
