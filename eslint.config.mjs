/**
 * `eslint-config-next` v16 already ships flat config — it exports an array of
 * flat config objects directly. Passing it through `FlatCompat`, which exists
 * to translate legacy `.eslintrc` configs, made ESLint try to JSON-serialise a
 * plugin object that references itself, and the whole run died with
 * "Converting circular structure to JSON" before a single file was linted.
 */
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * Surfaces that still query the CMS from the presentation layer.
 *
 * This is a ratchet, not an amnesty: every one of these is scheduled to move
 * behind a repository, and the rule below is an `error` precisely so that no
 * NEW file can join the list. The list only ever shrinks — deleting an entry is
 * how a migration is marked done.
 *
 * Migrated so far: the shop grid and the product detail page (module
 * `@/modules/catalog`).
 */
const UNMIGRATED_CMS_CALLERS = [
  // account — needs an `account` module (users, addresses, orders)
  'src/app/(app)/(account)/layout.tsx',
  'src/app/(app)/(account)/account/page.tsx',
  'src/app/(app)/(account)/account/addresses/page.tsx',
  'src/app/(app)/(account)/orders/page.tsx',
  // Brackets are escaped because ESLint matches these as globs, where `[id]`
  // is a character class and would silently fail to match the real path.
  'src/app/(app)/(account)/orders/\\[id\\]/page.tsx',
  'src/app/(app)/find-order/page.tsx',
  'src/components/forms/FindOrderForm/sendOrderAccessEmail.ts',
  // auth — needs an `auth` module; see also the raw fetches in providers/Auth
  'src/app/(app)/login/page.tsx',
  'src/app/(app)/create-account/page.tsx',
  // content — needs a `pages` module
  'src/app/(app)/\\[slug\\]/page.tsx',
  'src/blocks/ArchiveBlock/Component.tsx',
  'src/blocks/Carousel/Component.tsx',
  // categories — belongs in the catalog module, next batch
  'src/components/CategoryTabs/index.tsx',
  'src/components/layout/search/Categories.tsx',
  // CMS plumbing rather than presentation: preview and seeding are operational
  // routes that talk to Payload by definition.
  'src/app/(app)/next/preview/route.ts',
  'src/app/(app)/next/seed/route.ts',
]

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  /**
   * Architecture boundaries.
   *
   * Without these the layering is a convention, and a convention is something
   * the next person under deadline pressure works around in one line. These
   * make the same shortcut a failing build.
   *
   * See .claude/skills/payload/reference/HEXAGONAL.md for the reasoning behind
   * each zone.
   */
  {
    // ── Zone 1: the domain imports nothing ────────────────────────────────
    // If a domain type needs the CMS to compile, the domain is modelling the
    // database instead of the business.
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'payload',
              message:
                'The domain layer cannot import Payload. Move CMS access to infrastructure/repositories/.',
            },
            {
              name: '@payload-config',
              message: 'The domain layer cannot import the Payload config.',
            },
            {
              name: '@/payload-types',
              message:
                'Generated CMS types belong in infrastructure/dto/ only. Define the shape the views need instead.',
            },
            {
              name: 'react',
              message: 'The domain layer is framework-free. Presentation concerns live in app/.',
            },
            {
              name: 'next',
              message: 'The domain layer is framework-free.',
            },
            { name: 'server-only', message: 'The domain layer runs anywhere.' },
          ],
          patterns: [
            {
              group: ['@payloadcms/*', 'next/*', 'react-dom*'],
              message: 'The domain layer is framework-free and CMS-free.',
            },
            {
              group: ['**/infrastructure/**'],
              message:
                'Dependencies point inward: the domain defines ports, infrastructure implements them.',
            },
          ],
        },
      ],
    },
  },
  {
    // ── Zone 2: only the DTO layer may speak CMS types ────────────────────
    files: ['src/modules/*/infrastructure/**/*.ts'],
    ignores: ['src/modules/*/infrastructure/dto/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/payload-types',
              message:
                'Generated CMS types belong in infrastructure/dto/. Import the DTO from there so the wire contract stays in one file.',
            },
          ],
        },
      ],
    },
  },
  {
    // ── Zone 3: presentation asks the module, never the CMS ───────────────
    // `getPayload()` in a page is the exact thing this architecture exists to
    // remove: it puts a query, its access rules and its field selection inside
    // a component, where no other surface can reuse or verify them.
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}', 'src/blocks/**/*.{ts,tsx}'],
    ignores: [
      // The Payload-owned route group is the CMS's own mount point, not our
      // presentation layer — it must import Payload to exist at all.
      'src/app/(payload)/**',
      ...UNMIGRATED_CMS_CALLERS,
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'payload',
              importNames: ['getPayload'],
              message:
                'Presentation does not query the CMS directly. Use a repository from @/modules/<domain>/server.',
            },
          ],
          patterns: [
            {
              group: ['@/modules/*/domain/*', '@/modules/*/infrastructure/*'],
              message:
                'Import from the module barrel (@/modules/<domain> or @/modules/<domain>/server), not from its internals.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['.next/', '.open-next/', 'src/payload-types.ts', 'src/payload-generated-schema.ts'],
  },
]

export default eslintConfig
