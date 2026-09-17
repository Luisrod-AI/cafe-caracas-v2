#!/usr/bin/env node
/**
 * Fails the build if the Worker bundle contains the Node build of libSQL.
 *
 * Why this exists
 * ---------------
 * `@payloadcms/db-sqlite` imports `@libsql/client`, which ships conditional
 * exports. The `node` condition resolves to `lib-esm/node.js`, which reaches
 * `lib-esm/sqlite3.js`, which does `import Database from 'libsql'` — a native
 * `.node` binding. workerd cannot load it. The `workerd` condition resolves to
 * `lib-esm/web.js`, which is fetch-only and safe.
 *
 * `serverExternalPackages` in next.config.ts is what makes the right condition
 * win. That is a build-time arrangement between three moving parts — Next, the
 * OpenNext adapter, and libSQL's own exports map — and any of them can change
 * under an upgrade. When it breaks, the build still succeeds and the failure
 * only appears as a runtime error on Cloudflare, after deploy.
 *
 * So the arrangement is verified rather than trusted.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const BUNDLE_DIR = '.open-next'

/**
 * Each pattern is a way the native client can show up: as a surviving bare
 * import, as inlined source from the entry that pulls it in, or as the
 * alternative native driver.
 */
const FORBIDDEN = [
  {
    label: 'bare import of the native `libsql` package',
    pattern: /(?:require\(|from\s*|import\()\s*["']libsql["']/,
  },
  {
    label: 'inlined `@libsql/client` sqlite3 entry',
    pattern: /@libsql\/client\/lib-esm\/sqlite3|libsql[\\/]lib-esm[\\/]sqlite3/,
  },
  {
    label: 'native better-sqlite3 driver',
    pattern: /require\(["']better-sqlite3["']\)|from\s*["']better-sqlite3["']/,
  },
  {
    // Scoped to a require/import call: a bare string ending in `.node` is
    // common enough elsewhere to produce false failures.
    label: 'native addon loaded at runtime (.node binding)',
    pattern: /(?:require|import)\(\s*["'][^"']*\.node["']\s*\)/,
  },
]

/**
 * `withFileTypes` reports a symlink as a symlink, not as what it points at, and
 * pnpm's output tree is full of symlinked package directories. `statSync`
 * follows the link, which is what the question "is this a file I can read"
 * actually needs. Broken links are skipped rather than fatal.
 */
/**
 * Directories that are build input or static output, not deployed code.
 *
 * `node_modules` matters most: OpenNext leaves the traced package tree beside
 * the bundle, so `@libsql/client/lib-esm/sqlite3.js` sits on disk with its
 * native import intact. It is never deployed — esbuild already inlined only the
 * entry the `workerd` condition selected into `handler.mjs`. Scanning it
 * produces a failure for a file that will never reach Cloudflare.
 */
const SKIP_DIRS = new Set(['node_modules', 'assets', 'cache'])

function collectJsFiles(dir, seen = new Set()) {
  let found = []

  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue

    const full = join(dir, entry)

    let stats
    try {
      stats = statSync(full)
    } catch {
      continue // dangling symlink
    }

    if (stats.isDirectory()) {
      // Symlink cycles are possible in a pnpm tree; visit each real path once.
      const key = `${stats.dev}:${stats.ino}`
      if (seen.has(key)) continue
      seen.add(key)

      found = found.concat(collectJsFiles(full, seen))
    } else if (stats.isFile() && /\.(js|mjs|cjs)$/.test(entry)) {
      found.push(full)
    }
  }

  return found
}

try {
  statSync(BUNDLE_DIR)
} catch {
  console.error(`✗ ${BUNDLE_DIR}/ not found. Run \`pnpm cf:build\` first.`)
  process.exit(1)
}

const files = collectJsFiles(BUNDLE_DIR)
const hits = []

for (const file of files) {
  const source = readFileSync(file, 'utf8')

  for (const { label, pattern } of FORBIDDEN) {
    if (pattern.test(source)) hits.push({ file, label })
  }
}

if (hits.length > 0) {
  console.error('✗ Worker bundle contains Node-only SQLite code.\n')

  for (const { file, label } of hits) {
    console.error(`  ${file}\n    → ${label}`)
  }

  console.error(
    '\nThis deploys successfully and then fails at the first database query on\n' +
      'Cloudflare. Check that `serverExternalPackages` in next.config.ts still\n' +
      'lists `@libsql/client`, and that @libsql/client still declares a\n' +
      '`workerd` export condition in its package.json.',
  )
  process.exit(1)
}

console.log(`✓ Worker bundle is free of Node-only SQLite code (${files.length} files scanned).`)
