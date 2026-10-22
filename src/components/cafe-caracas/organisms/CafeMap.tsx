'use client'

import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'

import type { CafeSummary } from '@/modules/cafes'

setWorkerUrl(
  new URL(
    'maplibre-gl/dist/maplibre-gl-worker.mjs',
    import.meta.url,
  ).toString(),
)

type Props = {
  cafes: CafeSummary[]
  onCafeSelect?: (cafe: CafeSummary) => void
  selectedCafeSlug?: string | null
}

type MapCafe = CafeSummary & {
  coordinates: {
    latitude: number
    longitude: number
  }
}

const CARACAS_CENTER: L.LatLngExpression = [10.4895, -66.875]


function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function createBrandMark() {
  return `
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="#6D7548"
      />
      <path
        d="M10.2 5.7C8.2 7.3 7.2 9.6 7.5 12.2C7.8 14.9 9.1 17.2 11.1 18.6"
        stroke="#F8F6EF"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path
        d="M13.8 5.7C15.8 7.3 16.8 9.6 16.5 12.2C16.2 14.9 14.9 17.2 12.9 18.6"
        stroke="#F8F6EF"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  `
}

function createCafeMarker(
  cafe: MapCafe,
  onCafeSelect?: (cafe: CafeSummary) => void,
) {
  const name = escapeHtml(cafe.name)

  const rating =
    cafe.rating !== null && cafe.rating !== undefined
      ? Number(cafe.rating).toFixed(1)
      : null

  return L.marker(
    [
      cafe.coordinates.latitude,
      cafe.coordinates.longitude,
    ],
    {
      icon: L.divIcon({
        className: 'cafe-map-marker',
        html: `
          <div
            style="
              position: relative;
              width: 44px;
              height: 52px;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              filter: drop-shadow(0 4px 7px rgba(0,0,0,0.18));
            "
          >
            <div
              style="
                position: absolute;
                top: 0;
                width: 42px;
                height: 42px;
                border-radius: 50% 50% 50% 0;
                background: #6D7548;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <div
                style="
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: #F8F6EF;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transform: rotate(45deg);
                "
              >
                ${createBrandMark()}
              </div>
            </div>
          </div>
        `,
        iconSize: [44, 52],
        iconAnchor: [22, 52],
        popupAnchor: [0, -48],
      }),
    },
  ).bindPopup(`
    <div
      style="
        min-width: 190px;
        padding: 2px;
        font-family: Arial, sans-serif;
      "
    >
      <div
        style="
          font-size: 15px;
          line-height: 1.35;
          font-weight: 700;
          color: #34271f;
          margin-bottom: 7px;
        "
      >
        ${name}
      </div>

      ${
        rating
          ? `
            <div
              style="
                font-size: 13px;
                color: #6D7548;
                font-weight: 600;
                margin-bottom: 4px;
              "
            >
              ★ ${rating}
            </div>
          `
          : ''
      }

      ${
        cafe.zone
          ? `
            <div
              style="
                font-size: 12px;
                color: #7c756d;
              "
            >
              ${escapeHtml(String(cafe.zone))}
            </div>
          `
          : ''
            }
    </div>
  `).on('click', () => {
    onCafeSelect?.(cafe)
  })
}


export const CafeMap: React.FC<Props> = ({
  cafes,
  onCafeSelect,
  selectedCafeSlug,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const mapLibreLayerRef = useRef<L.Layer | null>(null)

  // Initialize the map once.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const map = L.map(mapContainerRef.current, {
  zoomControl: false,
  scrollWheelZoom: true,
})

const mapLibreLayer = maplibreGL({
  style: 'https://tiles.openfreemap.org/styles/positron',
}).addTo(map)

L.control
  .zoom({
    position: 'bottomright',
  })
  .addTo(map)

const markersLayer = L.layerGroup().addTo(map)

mapRef.current = map
markersLayerRef.current = markersLayer
mapLibreLayerRef.current = mapLibreLayer

    map.setView(CARACAS_CENTER, 13)

    requestAnimationFrame(() => {
      map.invalidateSize({
        animate: false,
      })
    })

    return () => {
  mapLibreLayer.remove()
  markersLayer.clearLayers()
  map.remove()

  mapLibreLayerRef.current = null
  markersLayerRef.current = null
  mapRef.current = null
}
  }, [])

  // Render markers whenever the result set or selection changes.
  useEffect(() => {
    const map = mapRef.current
    const markersLayer = markersLayerRef.current

    if (!map || !markersLayer) {
      return
    }

    const validCafes = cafes.filter(
      (cafe): cafe is MapCafe =>
        Boolean(cafe.coordinates) &&
        Number.isFinite(cafe.coordinates?.latitude) &&
        Number.isFinite(cafe.coordinates?.longitude),
    )

    markersLayer.clearLayers()

    if (validCafes.length === 0) {
      map.setView(CARACAS_CENTER, 13)
      return
    }

    const visibleCafes = selectedCafeSlug
      ? validCafes.filter(
          (cafe) => cafe.slug === selectedCafeSlug,
        )
      : validCafes

    if (visibleCafes.length === 0) {
      return
    }

    const markers = visibleCafes.map((cafe) =>
      createCafeMarker(cafe, onCafeSelect),
    )

    markers.forEach((marker) => {
      markersLayer.addLayer(marker)
    })

    if (selectedCafeSlug && visibleCafes.length === 1) {
      const cafe = visibleCafes[0]
      const marker = markers[0]

      map.flyTo(
        [
          cafe.coordinates.latitude,
          cafe.coordinates.longitude,
        ],
        16,
        {
          animate: true,
          duration: 0.7,
        },
      )

      map.once('moveend', () => {
        marker.openPopup()
      })
    } else {
      const bounds = L.latLngBounds(
        visibleCafes.map((cafe) => [
          cafe.coordinates.latitude,
          cafe.coordinates.longitude,
        ]),
      )

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 14,
          animate: false,
        })
      }
    }

    requestAnimationFrame(() => {
      map.invalidateSize({
        animate: false,
      })
    })
  }, [cafes, selectedCafeSlug, onCafeSelect])

  return (
    <div
  ref={mapContainerRef}
  className="h-full min-h-0 w-full overflow-hidden rounded-[28px]"
/>
  )
}