#!/usr/bin/env node
/**
 * Loads the prototype's `cafes.json` into the `cafes` collection.
 *
 * Idempotent by slug: a café that already exists is updated, not duplicated, so
 * the script can be re-run after a schema change without clearing the table
 * first.
 *
 * Run against whichever database `DATABASE_URL` points at:
 *   DATABASE_URL=... DATABASE_AUTH_TOKEN=... node scripts/seed-cafes.mjs [path.json]
 */
/**
 * Loaded FIRST, and as a side-effect import, because `@payload-config` reads
 * `PAYLOAD_SECRET` and `DATABASE_URL` while its module body evaluates. Static
 * imports run in source order, so moving this line below the config import
 * means the config sees an empty environment and Payload refuses to start.
 */
import 'dotenv/config'

import { readFileSync } from 'node:fs'

import config from '@payload-config'
import { getPayload } from 'payload'

const SOURCE = process.argv[2] || '/tmp/cafes.json'
const MENU_SOURCE = process.argv[3] || null
const IMAGE_BASE = 'https://luisrod-ai.github.io/cafe-caracas/'

/**
 * Menus keyed by slug, loaded from the prototype's separate feed.
 *
 * They live in a different source because the prototype fetches them from a
 * Google Apps Script at runtime. Here they become rows of `cafes_menu`, so the
 * detail page reads them in the same query as the rest of the café.
 */
const menusBySlug = MENU_SOURCE
  ? (JSON.parse(readFileSync(MENU_SOURCE, 'utf8')).cafes ?? {})
  : {}

/** Matches the `slugField` helper Payload applies to the collection. */
function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * `null` means "nobody has checked", `true`/`false` mean somebody did.
 * Collapsing the first into `false` would file every unverified café under
 * "does not have it".
 */
function amenity(value) {
  if (value === null || value === undefined) return 'unknown'
  return value ? 'yes' : 'no'
}

/** Payload rejects an empty string where it expects a date. */
function date(value) {
  return value ? new Date(value).toISOString() : undefined
}

function toHours(hours) {
  if (!hours) return undefined

  const out = {}
  for (const [day, value] of Object.entries(hours)) {
    if (value?.open || value?.close) {
      out[day] = { close: value.close ?? undefined, open: value.open ?? undefined }
    }
  }
  return Object.keys(out).length ? out : undefined
}

/** Only items with a name survive — an unnamed row renders as a blank card. */
function toMenu(slug) {
  const items = menusBySlug[slug]?.items ?? []

  return items
    .filter((item) => item?.name)
    .map((item) => ({
      name: String(item.name),
      currency: item.currency ?? undefined,
      imageUrl: item.image_url ?? undefined,
      price: item.price != null ? String(item.price) : undefined,
    }))
}

function toDoc(cafe) {
  const slug = slugify(cafe.name)

  return {
    name: cafe.name,
    menu: toMenu(slug),
    amenities: {
      brunch: amenity(cafe.amenities?.brunch),
      cozy: amenity(cafe.amenities?.cozy),
      coworking: amenity(cafe.amenities?.coworking),
      parking: amenity(cafe.amenities?.parking),
      petFriendly: amenity(cafe.amenities?.pet_friendly),
      sightseeing: amenity(cafe.amenities?.sightseeing),
      terrace: amenity(cafe.amenities?.terrace),
      wifi: amenity(cafe.amenities?.wifi),
    },
    branch: cafe.branch ?? undefined,
    brand: cafe.brand ?? undefined,
    category: cafe.category ?? undefined,
    coordinateAccuracy: cafe.coordinate_accuracy ?? undefined,
    coordinateSource: cafe.coordinate_source ?? undefined,
    cost: cafe.cost ?? undefined,
    filterReady: {
      amenities: Boolean(cafe.filter_ready?.amenities),
      coordinates: Boolean(cafe.filter_ready?.coordinates),
      hours: Boolean(cafe.filter_ready?.hours),
      municipality: Boolean(cafe.filter_ready?.municipality),
      price: Boolean(cafe.filter_ready?.price),
      zone: Boolean(cafe.filter_ready?.zone),
    },
    hours: toHours(cafe.hours),
    hoursSource: cafe.hours_source ?? undefined,
    hoursVerified: date(cafe.hours_verified),
    imageType: cafe.image_type ?? undefined,
    imageUrl: cafe.image ? IMAGE_BASE + cafe.image : undefined,
    imageVerified: Boolean(cafe.image_verified),
    instagram: cafe.instagram ?? undefined,
    latitude: cafe.latitude ?? undefined,
    link: cafe.link ?? undefined,
    location: cafe.location ?? undefined,
    longitude: cafe.longitude ?? undefined,
    municipality: cafe.municipality ?? undefined,
    neighborhood: cafe.neighborhood ?? undefined,
    notes: cafe.notes ?? undefined,
    otherLocations: (cafe.other_locations ?? []).map((label) => ({ label: String(label) })),
    /* `?? undefined` and not `|| undefined`: a café rated 0 is a real rating,
       and `||` would drop it as if nobody had rated the place. */
    rate: cafe.rate ?? undefined,
    research: {
      confidence: cafe.research?.confidence ?? undefined,
      sources: (cafe.research?.sources ?? []).map((s) => ({ type: s.type, url: s.url })),
      verifiedAt: date(cafe.research?.verified_at),
    },
    slug,
    sourceType: cafe.source_type ?? undefined,
    sourceUrl: cafe.source_url ?? undefined,
    status: cafe.status ?? undefined,
    website: cafe.website ?? undefined,
    zone: cafe.zone ?? undefined,
    zones: cafe.zones ?? undefined,
  }
}

const payload = await getPayload({ config })
const source = JSON.parse(readFileSync(SOURCE, 'utf8')).filter((c) => c.name)

let created = 0
let updated = 0
let failed = 0

for (const cafe of source) {
  const data = toDoc(cafe)

  try {
    const existing = await payload.find({
      collection: 'cafes',
      limit: 1,
      pagination: false,
      where: { slug: { equals: data.slug } },
    })

    if (existing.docs.length > 0) {
      await payload.update({ collection: 'cafes', data, id: existing.docs[0].id })
      updated += 1
    } else {
      await payload.create({ collection: 'cafes', data })
      created += 1
    }
  } catch (error) {
    failed += 1
    console.error(`✗ ${cafe.name}: ${error instanceof Error ? error.message : error}`)
  }
}

console.log(`\n✓ creados: ${created}  actualizados: ${updated}  fallidos: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
