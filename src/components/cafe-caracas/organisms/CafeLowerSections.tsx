import React from 'react'

import type { CafeDetail } from '@/modules/cafes'
import { AMENITY_LABELS } from '@/modules/cafes'

import { BrandMark } from '../atoms/BrandMark'

/** A section heading, shared by the three lower blocks. */
const SectionTitle: React.FC<{ children: React.ReactNode; id?: string }> = ({ children, id }) => (
  <h2
    className="mb-[18px] font-cc-display text-[30px] font-bold leading-tight tracking-[-0.02em] text-cc-ink-strong"
    id={id}
  >
    {children}
  </h2>
)

/**
 * "Lo que encontrarás" — the confirmed amenities.
 *
 * Rendered only when there is at least one. The original shows an empty row
 * otherwise, which reads as a broken section rather than as "we do not know".
 */
const Amenities: React.FC<{ amenities: CafeDetail['amenities'] }> = ({ amenities }) => {
  if (amenities.length === 0) return null

  return (
    <section aria-labelledby="amenitiesTitle" className="border-t border-[rgb(51_38_31/0.1)] py-9">
      <SectionTitle id="amenitiesTitle">Lo que encontrarás</SectionTitle>

      <div className="flex flex-wrap gap-3">
        {amenities.map((key) => (
          <div
            className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-[rgb(51_38_31/0.12)] bg-cc-surface px-4"
            key={key}
          >
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-full bg-[rgb(100_106_69/0.12)] text-[13px] font-bold text-cc-olive-deep"
            >
              {AMENITY_LABELS[key].charAt(0)}
            </span>

            <span className="text-[13px] font-medium text-cc-ink">{AMENITY_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * "Ubicación" — address, a link out to Maps, and a static map image.
 *
 * The original mounts Leaflet with Esri tiles. Here the map is a static tile
 * composed from the same Esri service: it needs no JavaScript, no third-party
 * script on a server-rendered page, and no client bundle — and the card is a
 * preview that links out anyway, so panning it was never the point.
 *
 * Rendered only when the coordinates were actually verified. An unverified pair
 * still draws a pin, just in the wrong place.
 */
const LocationPanel: React.FC<{ cafe: CafeDetail }> = ({ cafe }) => (
  <section aria-labelledby="locationTitle" className="pr-7 max-[900px]:pr-0">
    <SectionTitle id="locationTitle">Ubicación</SectionTitle>

    <div className="flex flex-col gap-4">
      <div>
        <p className="m-0 text-sm text-cc-muted">{cafe.address}</p>

        {cafe.mapUrl ? (
          <a
            className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[rgb(51_38_31/0.14)] bg-cc-surface px-5 text-[13px] font-semibold text-cc-olive-deep transition-colors duration-200 hover:border-[rgb(51_38_31/0.28)]"
            href={cafe.mapUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            Ver en Google Maps
          </a>
        ) : null}
      </div>

      {cafe.coordinates ? (
        <div className="relative h-[220px] overflow-hidden rounded-2xl border border-[rgb(51_38_31/0.12)] bg-[rgb(230_221_207/0.5)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a raster map
              tile from a third-party service, not a project asset; routing it
              through the image optimiser would cache someone else's tiles. */}
          <img
            alt={`Mapa de ${cafe.name}`}
            className="h-full w-full object-cover"
            loading="lazy"
            src={`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/export?bbox=${cafe.coordinates.longitude - 0.006},${cafe.coordinates.latitude - 0.004},${cafe.coordinates.longitude + 0.006},${cafe.coordinates.latitude + 0.004}&bboxSR=4326&size=600,220&format=png&f=image`}
          />

          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-cc-olive text-base shadow-cc-pill"
          >
            ☕
          </span>
        </div>
      ) : null}
    </div>
  </section>
)

/** "Opiniones" — the placeholder state, as in the original. */
const ReviewsPanel: React.FC = () => (
  <section
    aria-labelledby="reviewsTitle"
    className="border-l border-[rgb(51_38_31/0.1)] pl-7 max-[900px]:border-l-0 max-[900px]:pl-0 max-[900px]:pt-6"
  >
    <div className="mb-[18px] flex items-baseline justify-between gap-4">
      <SectionTitle id="reviewsTitle">Opiniones</SectionTitle>
      <span className="text-[13px] font-semibold text-cc-olive">Ver todas</span>
    </div>

    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(79_84_54/0.3)] px-6 text-center">
      <BrandMark size={40} />
      <p className="mt-3 text-sm leading-relaxed text-cc-muted">
        Próximamente podrás consultar opiniones de este café directamente desde Caracas Café.
      </p>
    </div>
  </section>
)

/**
 * Everything below the fold: amenities, then location and reviews side by side.
 *
 * Grouped into one component because the three share a rhythm — the same
 * heading size, the same vertical padding, the same hairline rules — and
 * splitting them into three files would put that agreement in three places.
 */
export const CafeLowerSections: React.FC<{ cafe: CafeDetail }> = ({ cafe }) => (
  <section className="mt-9">
    <Amenities amenities={cafe.amenities} />

    <div className="grid grid-cols-[minmax(0,540px)_1fr] border-t border-[rgb(51_38_31/0.1)] py-[30px] max-[900px]:grid-cols-1">
      <LocationPanel cafe={cafe} />
      <ReviewsPanel />
    </div>
  </section>
)
