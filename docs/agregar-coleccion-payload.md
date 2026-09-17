# Cómo agregar una colección a Payload

Guía de referencia del proceso completo, desde definir la colección hasta
renderizarla en una página. Escrita a partir de la colección `cafes`, que está
en el repositorio y sirve de ejemplo funcionando.

**Son 5 pasos obligatorios y 1 opcional.** El proceso es mecánico: una colección
es un objeto de configuración, y los campos son objetos dentro de él.

---

## Índice

1. [Paso 1 — Definir la colección](#paso-1--definir-la-colección)
2. [Paso 2 — Registrarla en la config](#paso-2--registrarla-en-la-config)
3. [Paso 3 — Generar los tipos](#paso-3--generar-los-tipos)
4. [Paso 4 — Crear y aplicar la migración](#paso-4--crear-y-aplicar-la-migración)
5. [Paso 5 — Consumirla desde el frontend](#paso-5--consumirla-desde-el-frontend)
6. [Paso 6 (opcional) — Sembrar datos](#paso-6-opcional--sembrar-datos)
7. [Referencia de tipos de campo](#referencia-de-tipos-de-campo)
8. [Trampas conocidas](#trampas-conocidas)
9. [Checklist](#checklist)

---

## Paso 1 — Definir la colección

Un archivo nuevo en `src/collections/`, exportando un objeto `CollectionConfig`.

**Archivo de ejemplo:** [`src/collections/Cafes.ts`](../src/collections/Cafes.ts)

```ts
import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Cafes: CollectionConfig = {
  slug: 'cafes',                    // nombre de la tabla, del tipo y del endpoint REST
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,               // lectura pública
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'municipality', 'rate'],  // columnas del listado
    group: 'Content',                                   // agrupación en el menú lateral
    useAsTitle: 'name',                                 // qué texto identifica cada fila
  },
  fields: [
    { name: 'name', type: 'text', index: true, required: true },
    slugField({ position: undefined }),
    // ...
  ],
}
```

### El `slug` decide tres cosas a la vez

| El `slug` `'cafes'` genera | Resultado |
| --- | --- |
| Tabla en la base | `cafes` |
| Tipo TypeScript | `Cafe` (singulariza) |
| Endpoint REST | `/api/cafes` y `/api/cafes/:id` |

Cambiarlo después implica una migración que renombra la tabla. Conviene
acertarle a la primera.

### `access` no es opcional

Payload **no** aplica control de acceso por defecto en la Local API. La
colección lo declara, pero es el repositorio quien lo activa pasando
`overrideAccess: false` en cada query. Omitirlo devuelve filas que la regla
pública oculta.

### Generá los campos repetidos, no los escribas

Si el mismo bloque se repite, usá `map()`:

```ts
const WEEKDAYS = [
  { label: 'Lunes', name: 'monday' },
  { label: 'Martes', name: 'tuesday' },
  // ...
] as const

const hoursFields: Field[] = WEEKDAYS.map(({ label, name }) => ({
  name,
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'open', type: 'text', label: 'Abre' },
        { name: 'close', type: 'text', label: 'Cierra' },
      ],
    },
  ],
  label,
}))
```

Siete días escritos a mano es exactamente como el jueves termina con un campo
que los otros seis no tienen.

### Agrupá en `tabs` cuando pasás de ~15 campos

`cafes` tiene más de 40. Planos, el panel es inusable:

```ts
fields: [
  { name: 'name', type: 'text', required: true },
  slugField({ position: undefined }),
  {
    type: 'tabs',
    tabs: [
      { label: 'General',  fields: [ /* ... */ ] },
      { label: 'Ubicación', fields: [ /* ... */ ] },
      { label: 'Horario',   fields: [ /* ... */ ] },
    ],
  },
]
```

Los campos fuera de `tabs` (como `name` y el slug) aparecen arriba, siempre
visibles. Ahí van los que identifican el documento.

---

## Paso 2 — Registrarla en la config

Dos líneas en [`src/payload.config.ts`](../src/payload.config.ts):

```ts
import { Cafes } from '@/collections/Cafes'

export default buildConfig({
  collections: [Users, Pages, Categories, Cafes, Media],
  // ...
})
```

Sin esto la colección no existe para Payload, por más que el archivo esté
escrito.

---

## Paso 3 — Generar los tipos

```bash
pnpm generate:types
```

Escribe la interfaz en [`src/payload-types.ts`](../src/payload-types.ts):

```ts
export interface Cafe {
  id: number
  name: string
  slug?: string | null
  rate?: number | null
  // ...
}
```

**Corrélo cada vez que toques un campo.** Si no, TypeScript sigue viendo el
esquema viejo y te deja escribir código contra campos que ya no existen.

---

## Paso 4 — Crear y aplicar la migración

```bash
pnpm payload migrate:create add_cafes   # genera el SQL
pnpm payload migrate                    # lo aplica
```

Genera dos archivos en `src/migrations/`:

- `20260917_134059_add_cafes.ts` — las sentencias `up` y `down`
- `20260917_134059_add_cafes.json` — el **snapshot** del esquema resultante

### Cómo calcula el delta

`migrate:create` **no** compara contra la base de datos conectada. Compara
contra el **snapshot JSON de la migración anterior**.

Eso importa por dos motivos:

1. Podés generar la migración conectado a cualquier base — el resultado es el
   mismo.
2. **Los `.json` se commitean.** Si se pierden, la próxima migración se genera
   contra la nada y vuelve a crear todas las tablas.

La migración de `cafes` salió con 5 `CREATE TABLE`, todas de cafés, ninguna de
las otras colecciones. Ese es el resultado esperado de un delta correcto.

### Contra qué base aplicarla

**Contra las dos, siempre.**

```bash
# Local
DATABASE_URL="file:./cafe-caracas.db" pnpm payload migrate

# Turso (producción)
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." pnpm payload migrate
```

### Por qué el push de Drizzle está apagado

Payload trae un modo de desarrollo (`push: true`) que sincroniza el esquema solo,
sin migraciones. Es cómodo, y en este proyecto **está desactivado en
[`src/lib/database.ts`](../src/lib/database.ts)**.

El push corre en cada `getPayload()`: introspecciona la base, la compara con el
config y aplica la diferencia. Eso funciona sobre una base que el propio push
creó, y **choca contra una construida por migraciones** — no reconoce los
índices que las migraciones ya hicieron, los vuelve a emitir, y la conexión
muere:

```txt
SQLITE_ERROR: index payload_locked_documents_rels_order_idx already exists
```

O sea que los dos no pueden compartir una base. Y mantener push en local con
migraciones en producción es justo lo que hace que los dos esquemas diverjan —
una divergencia que solo aparece al desplegar.

Por eso hay **un solo camino**: `migrate:create` y `migrate`, en local y en
Turso por igual. Cambiar un campo cuesta un comando extra; a cambio, aquello
contra lo que desarrollás es lo que se despliega.

### Si la base local queda inconsistente

No tiene datos que valga la pena conservar. Reconstruirla es más rápido que
repararla:

```bash
rm -f cafe-caracas.db cafe-caracas.db-shm cafe-caracas.db-wal
DATABASE_URL="file:./cafe-caracas.db" pnpm payload migrate
DATABASE_URL="file:./cafe-caracas.db" NODE_OPTIONS="--no-deprecation --import=tsx/esm" \
  node scripts/seed-cafes.mjs /tmp/cafes.json /tmp/menu.json
```

Ver [CLOUDFLARE-TURSO.md](../.claude/skills/payload/reference/CLOUDFLARE-TURSO.md).

### Qué cambios necesitan migración y cuáles no

| Cambio | ¿Migración? |
| --- | --- |
| Agregar / quitar / renombrar un campo | **Sí** |
| Cambiar el tipo de un campo | **Sí** |
| Agregar valores a las `options` de un `select` | **No** — es validación de Payload, no una restricción de la tabla |
| Cambiar `label`, `admin`, `description` | **No** — no tocan la base |

---

## Paso 5 — Consumirla desde el frontend

Acá entra la arquitectura hexagonal del proyecto. **Las páginas no llaman a
`getPayload`** — ESLint lo bloquea.

Ver [HEXAGONAL.md](../.claude/skills/payload/reference/HEXAGONAL.md) para el
contrato completo.

### El flujo

```
página  →  getCafeRepository()        ← composition root (server.ts)
           ↓
        ICafeRepository               ← el puerto        (domain/repositories/)
           ↓
   PayloadLocalCafeRepository         ← el adaptador     (infrastructure/repositories/)
           ↓
        cafeMapper                    ← CMS → dominio, campo a campo
           ↓
        CafeSummary / CafeDetail      ← lo que el componente recibe
```

### Estructura del módulo

**Ejemplo:** [`src/modules/cafes/`](../src/modules/cafes/)

```txt
src/modules/cafes/
├── domain/
│   ├── entities/Cafe.ts               # las formas que habla la app. NO importa nada
│   ├── repositories/ICafeRepository.ts# el puerto: solo la interfaz
│   └── errors/CafeErrors.ts           # errores tipados del módulo
├── infrastructure/
│   ├── dto/CafeDto.ts                 # ÚNICO lugar que importa @/payload-types
│   ├── mappers/cafeMapper.ts          # traduce, campo a campo
│   └── repositories/
│       └── PayloadLocalCafeRepository.ts  # ÚNICO lugar que llama getPayload
├── index.ts                           # barrel público — seguro en cliente
└── server.ts                          # barrel de servidor — 'server-only'
```

### Los dos barrels no son opcionales

`index.ts` **no** exporta el adaptador de Payload. Ese adaptador importa
`@payload-config`, que arrastra todas las colecciones y el adaptador de base de
datos a cualquier bundle que lo toque. Un solo componente de cliente importando
el barrel compartido se lleva todo eso al navegador.

`server.ts` lleva `import 'server-only'`: importarlo desde un componente de
cliente falla el build con un mensaje claro, en vez de romper en silencio.

### En la página son dos líneas

```tsx
import { getCafeRepository } from '@/modules/cafes/server'

export default async function CafeCaracasPage() {
  const cafes = await getCafeRepository().list({})

  return <CafeGrid cafes={cafes.results} />
}
```

Y por slug, para el detalle:

```tsx
const cafe = await getCafeRepository().getBySlug(slug)
if (!cafe) notFound()
```

**Lo que ganás:** la página de detalle reutiliza las mismas reglas de acceso, el
mismo `depth` y el mismo mapeo de imagen. No se copiaron — se importaron.

### El mapper traduce campo a campo, nunca con spread

```ts
// ✅
return {
  id: String(dto.id),
  name: dto.name,
  rating: typeof dto.rate === 'number' ? dto.rate : null,
}

// ❌
return { ...dto, id: String(dto.id) }
```

El spread deja pasar `filterReady`, `sourceUrl` y todo el bloque `research` a la
vista con los nombres del CMS. Y el fallo es **mudo**: la propiedad lee
`undefined`, la tarjeta renderiza sin precio, y nada explota.

---

## Paso 6 (opcional) — Sembrar datos

**Ejemplo:** [`scripts/seed-cafes.mjs`](../scripts/seed-cafes.mjs)

```bash
DATABASE_URL="..." DATABASE_AUTH_TOKEN="..." \
  NODE_OPTIONS="--no-deprecation --import=tsx/esm" \
  node scripts/seed-cafes.mjs datos.json
```

Dos reglas que valen la pena:

**Hacelo idempotente.** Buscá por slug y decidí entre `create` y `update`. Así
podés re-correrlo después de cambiar el esquema sin vaciar la tabla:

```js
const existing = await payload.find({
  collection: 'cafes',
  where: { slug: { equals: data.slug } },
})

existing.docs.length > 0
  ? await payload.update({ collection: 'cafes', data, id: existing.docs[0].id })
  : await payload.create({ collection: 'cafes', data })
```

**`import 'dotenv/config'` va PRIMERO**, antes de `@payload-config`:

```js
import 'dotenv/config'          // ← primero, siempre

import config from '@payload-config'
import { getPayload } from 'payload'
```

La config lee `PAYLOAD_SECRET` y `DATABASE_URL` mientras se evalúa su módulo, y
los imports estáticos corren en orden de aparición. Al revés, Payload arranca
sin secreto y se niega a iniciar.

---

## Referencia de tipos de campo

Los usados en `cafes`:

| Tipo | Para qué | Notas |
| --- | --- | --- |
| `text` | Cadena corta | |
| `textarea` | Texto largo sin formato | |
| `number` | Numérico | Acepta `min` / `max` |
| `checkbox` | Booleano | Solo dos estados — ojo con el `null` |
| `select` | Valor de una lista | `hasMany: true` para múltiple |
| `date` | Fecha | `admin.date.pickerAppearance: 'dayOnly'` para ocultar la hora |
| `upload` | Archivo | `relationTo: 'media'` |
| `relationship` | Vínculo a otra colección | |
| `group` | Agrupa campos bajo una clave | Genera columnas `grupo_campo` |
| `array` | Lista de sub-objetos | Genera **tabla aparte** |
| `row` | Layout: campos en línea | No existe en la base |
| `tabs` | Layout: pestañas | No existe en la base |

`row` y `tabs` son **solo presentación**. No crean columnas ni anidan datos.

### Campos de layout vs campos de datos

```ts
// row: layout. Los tres campos quedan al mismo nivel en la base.
{ type: 'row', fields: [
  { name: 'latitude', type: 'number' },
  { name: 'longitude', type: 'number' },
]}

// group: datos. Genera hours_monday_open, hours_monday_close, ...
{ name: 'hours', type: 'group', fields: [ /* ... */ ] }
```

---

## Trampas conocidas

Todas estas pasaron construyendo `cafes`.

### Las `options` de un `select` se derivan de los DATOS, no del diseño

Las opciones de `zone` salieron del dropdown del prototipo (seis zonas). Los
datos reales además tenían `sureste` y `varias`.

**Payload rechaza en silencio un valor fuera de `options` y la fila entera falla
al guardar.** Se perdieron 2 cafés de 110 y el error solo se vio en el log del
seed.

Antes de definir un `select`, sacá los valores reales:

```bash
python3 -c "
import json
d = json.load(open('datos.json'))
print(sorted({c['zone'] for c in d if c.get('zone')}))
"
```

### Un `checkbox` no puede representar «sin verificar»

Los `amenities` venían como `null` / `true` / `false`. Un checkbox colapsa
`null` en `false`, y mete todos los no verificados en el filtro negativo — «no
tiene wifi» cuando en realidad nadie lo comprobó.

Se resolvió con un `select` de tres estados:

```ts
options: [
  { label: 'Sin verificar', value: 'unknown' },
  { label: 'Sí', value: 'yes' },
  { label: 'No', value: 'no' },
]
```

### Un campo olvidado en el seed parece un dato faltante

`rate` quedó fuera del mapeo del seed. Todos los cafés mostraban rating `N/A`.
Como el resto de los campos estaba bien, parecía «al CMS le falta ese dato», no
un bug del script.

Después de sembrar, verificá contra la base:

```bash
curl -s -X POST "$TURSO_URL/v2/pipeline" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requests":[{"type":"execute","stmt":{"sql":"SELECT name, rate, cost FROM cafes LIMIT 3"}},{"type":"close"}]}'
```

### `?? undefined`, no `|| undefined`

```js
rate: cafe.rate ?? undefined,   // ✅ un 0 es un rating real
rate: cafe.rate || undefined,   // ❌ descarta el 0
```

### Las horas van como `text`, no como `date`

Un café abre a las 07:00 todos los martes. Eso es una hora del día sin fecha
asociada. Guardarla como timestamp obliga a inventar un día y arrastra una
zona horaria — que en un Worker es UTC, y te desplaza el horario de todos los
cafés para todos los visitantes.

---

## Checklist

Al agregar una colección:

- [ ] `src/collections/MiColeccion.ts` con `slug`, `access`, `admin`, `fields`
- [ ] Importada y agregada al array `collections` en `payload.config.ts`
- [ ] `pnpm generate:types`
- [ ] `pnpm payload migrate:create <nombre>`
- [ ] Revisar el `.ts` generado: ¿es un delta o recreó todo?
- [ ] `pnpm payload migrate` en local
- [ ] `pnpm payload migrate` contra Turso
- [ ] `pnpm dev` arranca sin errores de índice
- [ ] Commitear `src/migrations/*.ts` **y** `*.json`
- [ ] Módulo en `src/modules/<dominio>/` con puerto, adaptador y mapper
- [ ] `index.ts` y `server.ts` separados
- [ ] Página consumiendo el repositorio, sin `getPayload`
- [ ] `npx tsc --noEmit` limpio
- [ ] `pnpm lint` sin errores nuevos
- [ ] Verificado en el navegador, no solo con `curl`

---

## Ver también

- [HEXAGONAL.md](../.claude/skills/payload/reference/HEXAGONAL.md) — el contrato de capas
- [CLOUDFLARE-TURSO.md](../.claude/skills/payload/reference/CLOUDFLARE-TURSO.md) — despliegue y migraciones en producción
- [COLLECTIONS.md](../.claude/skills/payload/reference/COLLECTIONS.md) — referencia de configuración de colecciones
- [FIELDS.md](../.claude/skills/payload/reference/FIELDS.md) — todos los tipos de campo
