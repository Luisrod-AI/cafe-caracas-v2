import { slugField } from 'payload'
import type { CollectionConfig, Field } from 'payload'

import { adminOnly } from '@/access/adminOnly'

/**
 * Every zone value the directory actually uses.
 *
 * The union of two sources, and it has to be: the prototype's filter dropdown
 * offers six zones, while the research data also contains `sureste` and
 * `varias`. Taking only the dropdown's list rejected two real cafés on import —
 * a select silently refuses a value it does not know, and the row simply fails
 * to save.
 *
 * `varias` is not a place. It marks a brand with branches across the city, and
 * it is kept because dropping it would mean inventing a zone for those rows.
 */
const ZONE_OPTIONS = [
  { label: 'Este', value: 'este' },
  { label: 'Centro este', value: 'centro este' },
  { label: 'Centro', value: 'centro' },
  { label: 'Centro oeste', value: 'centro oeste' },
  { label: 'Oeste', value: 'oeste' },
  { label: 'Sureste', value: 'sureste' },
  { label: 'Sur', value: 'sur' },
  { label: 'Varias zonas', value: 'varias' },
]

/**
 * The seven weekday groups of the opening-hours block.
 *
 * Generated rather than written out seven times: the shape is identical for
 * every day, and hand-copying it is how Thursday ends up with a field the other
 * six do not have.
 *
 * Times are `text`, not `date`. A café opens at 07:00 every Tuesday — that is a
 * time of day with no calendar date attached, and storing it as a timestamp
 * forces an arbitrary date and drags a timezone in with it.
 */
const WEEKDAYS = [
  { label: 'Lunes', name: 'monday' },
  { label: 'Martes', name: 'tuesday' },
  { label: 'Miércoles', name: 'wednesday' },
  { label: 'Jueves', name: 'thursday' },
  { label: 'Viernes', name: 'friday' },
  { label: 'Sábado', name: 'saturday' },
  { label: 'Domingo', name: 'sunday' },
] as const

const hoursFields: Field[] = WEEKDAYS.map(({ label, name }) => ({
  name,
  type: 'group',
  admin: { hideGutter: true },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'open',
          type: 'text',
          admin: { placeholder: '07:00', width: '50%' },
          label: 'Abre',
        },
        {
          name: 'close',
          type: 'text',
          admin: { placeholder: '23:00', width: '50%' },
          label: 'Cierra',
        },
      ],
    },
  ],
  label,
}))

/**
 * The eight amenity flags.
 *
 * Three states, not two. The source data distinguishes "we checked and it has
 * wifi" from "nobody has checked yet", and both are `false` if this is a
 * checkbox — which would put every unverified café into the "no wifi" bucket
 * the moment someone filters by it.
 */
const AMENITIES = [
  { label: 'WiFi', name: 'wifi' },
  { label: 'Coworking', name: 'coworking' },
  { label: 'Cozy', name: 'cozy' },
  { label: 'Terraza', name: 'terrace' },
  { label: 'Pet friendly', name: 'petFriendly' },
  { label: 'Estacionamiento', name: 'parking' },
  { label: 'Brunch', name: 'brunch' },
  { label: 'Sightseeing', name: 'sightseeing' },
] as const

const amenityFields: Field[] = AMENITIES.map(({ label, name }) => ({
  name,
  type: 'select',
  admin: { width: '50%' },
  defaultValue: 'unknown',
  label,
  options: [
    { label: 'Sin verificar', value: 'unknown' },
    { label: 'Sí', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
}))

/**
 * A café in the Caracas directory.
 *
 * The field set mirrors the research dataset the directory was built from, so
 * an entry can round-trip without losing provenance. That is the point of the
 * `research`, `filterReady` and `coordinate*` blocks: they record how much of a
 * given row has actually been verified, which is what lets the frontend decide
 * whether a café may appear under a filter at all.
 *
 * Names are camelCase here while the source JSON is snake_case. Translating
 * between the two is the mapper's job in `src/modules/cafes/`; doing it in the
 * schema instead would put wire formatting into the database.
 */
export const Cafes: CollectionConfig = {
  slug: 'cafes',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'municipality', 'rate', 'cost', 'status'],
    group: 'Content',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      index: true,
      required: true,
    },
    /**
     * The URL key, and the only field the detail route looks a café up by.
     * Indexed because every `/cafe-caracas/[slug]` request is a lookup on it.
     */
    slugField({ position: undefined }),
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'rate',
                  type: 'number',
                  admin: {
                    description: 'Vacío cuando nadie la ha calificado — no es lo mismo que 0.',
                    width: '33%',
                  },
                  label: 'Calificación',
                  max: 5,
                  min: 0,
                },
                {
                  name: 'cost',
                  type: 'text',
                  admin: { placeholder: '10-40$', width: '33%' },
                  label: 'Rango de precio',
                },
                {
                  name: 'status',
                  type: 'text',
                  admin: { placeholder: 'Verificado: activo', width: '34%' },
                  label: 'Estado',
                },
              ],
            },
            {
              name: 'category',
              type: 'text',
              admin: {
                description:
                  'Texto libre separado por «/» o «,». El frontend lo parte para armar los chips.',
                placeholder: 'Cafetería / café',
              },
              label: 'Categoría',
            },
            {
              name: 'notes',
              type: 'textarea',
              label: 'Notas',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'brand',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Marca',
                },
                {
                  name: 'branch',
                  type: 'text',
                  admin: {
                    description: 'Para cadenas con varias sedes.',
                    width: '50%',
                  },
                  label: 'Sucursal',
                },
              ],
            },
          ],
          label: 'General',
        },
        {
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'zone',
                  type: 'select',
                  admin: { width: '50%' },
                  label: 'Zona principal',
                  options: ZONE_OPTIONS,
                },
                {
                  name: 'municipality',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Municipio',
                },
              ],
            },
            {
              name: 'zones',
              type: 'select',
              admin: {
                description: 'Un café en un límite puede pertenecer a más de una zona.',
              },
              hasMany: true,
              label: 'Todas las zonas',
              options: ZONE_OPTIONS,
            },
            {
              name: 'neighborhood',
              type: 'text',
              label: 'Urbanización',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'latitude',
                  type: 'number',
                  admin: { width: '50%' },
                  label: 'Latitud',
                },
                {
                  name: 'longitude',
                  type: 'number',
                  admin: { width: '50%' },
                  label: 'Longitud',
                },
              ],
            },
            {
              name: 'otherLocations',
              type: 'array',
              fields: [{ name: 'label', type: 'text', required: true }],
              label: 'Otras sedes',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'coordinateAccuracy',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Precisión de coordenadas',
                },
                {
                  name: 'coordinateSource',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Fuente de coordenadas',
                },
              ],
            },
          ],
          label: 'Ubicación',
        },
        {
          fields: [
            /**
             * Two ways to carry a photo, and both are needed for now.
             *
             * `image` is the real one: a Media document. `imageUrl` holds the
             * absolute URL of the prototype's own asset, so the 110 seeded
             * cafés render before anyone has uploaded anything. The mapper
             * prefers the upload and falls back to the URL, so the field can be
             * emptied row by row as images are migrated.
             */
            {
              name: 'image',
              type: 'upload',
              label: 'Imagen',
              relationTo: 'media',
            },
            {
              name: 'imageUrl',
              type: 'text',
              admin: {
                description:
                  'Temporal: URL absoluta del prototipo. Se ignora en cuanto exista una imagen cargada.',
              },
              label: 'URL de imagen externa',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'imageType',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Tipo de imagen',
                },
                {
                  name: 'imageVerified',
                  type: 'checkbox',
                  admin: { width: '50%' },
                  label: 'Imagen verificada',
                },
              ],
            },
          ],
          label: 'Imagen',
        },
        {
          fields: [
            {
              name: 'hours',
              type: 'group',
              fields: hoursFields,
              label: 'Horario',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'hoursSource',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Fuente del horario',
                },
                {
                  name: 'hoursVerified',
                  type: 'date',
                  admin: { date: { pickerAppearance: 'dayOnly' }, width: '50%' },
                  label: 'Horario verificado el',
                },
              ],
            },
          ],
          label: 'Horario',
        },
        {
          fields: [
            {
              name: 'amenities',
              type: 'group',
              fields: [{ type: 'row', fields: amenityFields.slice(0, 2) },
                { type: 'row', fields: amenityFields.slice(2, 4) },
                { type: 'row', fields: amenityFields.slice(4, 6) },
                { type: 'row', fields: amenityFields.slice(6, 8) }],
              label: 'Servicios',
            },
          ],
          label: 'Servicios',
        },
        {
          fields: [
            {
              /**
               * The featured-menu items.
               *
               * An `array`, so each item becomes a row in its own table rather
               * than a JSON blob — that is what lets a price be queried or an
               * item be reordered without rewriting the whole café.
               *
               * Prices are `text`, not `number`: the source carries "$5.00",
               * "5-10$" and blanks, and coercing those to a numeric column
               * would silently turn every unparseable price into null.
               */
              name: 'menu',
              type: 'array',
              admin: {
                description:
                  'Los primeros cuatro se muestran por página en el detalle del café.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      admin: { width: '55%' },
                      label: 'Plato',
                      required: true,
                    },
                    {
                      name: 'price',
                      type: 'text',
                      admin: { placeholder: '$5.00', width: '25%' },
                      label: 'Precio',
                    },
                    {
                      name: 'currency',
                      type: 'text',
                      admin: { width: '20%' },
                      label: 'Moneda',
                    },
                  ],
                },
                {
                  name: 'imageUrl',
                  type: 'text',
                  admin: { description: 'Opcional. Sin ella se usa el marcador.' },
                  label: 'URL de imagen',
                },
              ],
              label: 'Platos',
            },
          ],
          label: 'Menú',
        },
        {
          fields: [
            {
              name: 'link',
              type: 'text',
              admin: { description: 'Búsqueda en Google Maps.' },
              label: 'Enlace de mapa',
            },
            {
              name: 'location',
              type: 'text',
              admin: { description: 'Ficha exacta en Google Maps.' },
              label: 'Enlace de ubicación',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'website',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Sitio web',
                },
                {
                  name: 'instagram',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Instagram',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'sourceUrl',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'URL de origen',
                },
                {
                  name: 'sourceType',
                  type: 'text',
                  admin: { width: '50%' },
                  label: 'Tipo de origen',
                },
              ],
            },
            {
              name: 'research',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'verifiedAt',
                      type: 'date',
                      admin: { date: { pickerAppearance: 'dayOnly' }, width: '50%' },
                      label: 'Verificado el',
                    },
                    {
                      name: 'confidence',
                      type: 'select',
                      admin: { width: '50%' },
                      label: 'Confianza',
                      options: [
                        { label: 'Alta', value: 'high' },
                        { label: 'Media', value: 'medium' },
                        { label: 'Baja', value: 'low' },
                      ],
                    },
                  ],
                },
                {
                  name: 'sources',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'type', type: 'text', admin: { width: '40%' } },
                        { name: 'url', type: 'text', admin: { width: '60%' } },
                      ],
                    },
                  ],
                  label: 'Fuentes',
                },
              ],
              label: 'Investigación',
            },
            /**
             * What this row is actually usable for.
             *
             * A café with no coordinates must not appear on a map, and one with
             * unverified amenities must not appear under an amenity filter.
             * Recording that here — rather than inferring it from empty fields —
             * keeps "we know it has no terrace" apart from "nobody looked".
             */
            {
              name: 'filterReady',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'zone', type: 'checkbox', admin: { width: '33%' }, label: 'Zona' },
                    {
                      name: 'municipality',
                      type: 'checkbox',
                      admin: { width: '33%' },
                      label: 'Municipio',
                    },
                    {
                      name: 'coordinates',
                      type: 'checkbox',
                      admin: { width: '34%' },
                      label: 'Coordenadas',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'hours', type: 'checkbox', admin: { width: '33%' }, label: 'Horario' },
                    {
                      name: 'amenities',
                      type: 'checkbox',
                      admin: { width: '33%' },
                      label: 'Servicios',
                    },
                    { name: 'price', type: 'checkbox', admin: { width: '34%' }, label: 'Precio' },
                  ],
                },
              ],
              label: 'Listo para filtrar',
            },
          ],
          label: 'Fuentes',
        },
      ],
    },
  ],
}
