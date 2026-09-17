# Payload CMS Collections Reference

Complete reference for collection configurations and patterns.

> **Position: outside the hexagon. A collection defines the wire contract.**
>
> Payload is the external system here; you configure it, you do not wrap it. But every change in this file has a downstream consequence the compiler will not point at:
>
> **Changing a collection means revisiting that domain's DTO and mapper.**
>
> `pnpm generate:types` regenerates `@/payload-types`, and because the DTO is expressed as a *view* over those types (`Pick`, `Partial`), a removed field fails to compile — which is the point. But a **renamed** field, or one whose meaning changed while its type did not, compiles perfectly and reaches the view as `undefined`. Nothing throws.
>
> After editing a collection:
>
> ```bash
> pnpm generate:types
> npx tsc --noEmit                    # DTO views catch removals
> pnpm exec vitest run src/modules    # mappers catch the rest
> ```
>
> Do not model the domain entity on the collection. The collection is shaped by editorial and storage needs; the entity is shaped by what the views render. They drift on purpose. See [HEXAGONAL.md](HEXAGONAL.md).

## Basic Collection

```ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
    group: 'Content', // Organize in admin sidebar
    description: 'Blog posts and articles',
    listSearchableFields: ['title', 'slug'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      defaultValue: 'draft',
    },
  ],
  defaultSort: '-createdAt',
  timestamps: true,
}
```

## Auth Collection

```ts
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
    useAPIKey: true,
  },
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      required: true,
      defaultValue: ['user'],
      saveToJWT: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
```

## Upload Collection

```ts
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
      },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    crop: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
    },
  ],
}
```

## Live Preview

Enable real-time content preview during editing.

```ts
import type { CollectionConfig } from 'payload'

const generatePreviewPath = ({
  slug,
  collection,
  req,
}: {
  slug: string
  collection: string
  req: any
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
  return `${baseUrl}/api/preview?slug=${slug}&collection=${collection}`
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    // Live preview during editing
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug as string,
          collection: 'pages',
          req,
        }),
    },
    // Static preview button
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'text' },
  ],
}
```

## Versioning & Drafts

Payload maintains version history and supports draft/publish workflows.

```ts
import type { CollectionConfig } from 'payload'

// Basic versioning (audit log only)
export const Users: CollectionConfig = {
  slug: 'users',
  versions: true, // or { maxPerDoc: 100 }
  fields: [{ name: 'name', type: 'text' }],
}

// Drafts enabled (draft/publish workflow)
export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: {
    drafts: true, // Enables _status field
    maxPerDoc: 50,
  },
  fields: [{ name: 'title', type: 'text' }],
}

// Full configuration with autosave and scheduled publish
export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: {
    drafts: {
      autosave: true, // Auto-save while editing
      schedulePublish: true, // Schedule future publish/unpublish
      validate: false, // Don't validate drafts (default)
    },
    maxPerDoc: 100, // Keep last 100 versions (0 = unlimited)
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

### Draft API Usage

```ts
// Create draft
await payload.create({
  collection: 'posts',
  data: { title: 'Draft Post' },
  draft: true, // Saves as draft, skips required field validation
})

// Update as draft
await payload.update({
  collection: 'posts',
  id: '123',
  data: { title: 'Updated Draft' },
  draft: true,
})

// Read with drafts (returns newest draft if available)
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  draft: true, // Returns draft version if exists
})

// Query only published (REST API)
// GET /api/posts (returns only _status: 'published')

// Access control for drafts
export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: { drafts: true },
  access: {
    read: ({ req: { user } }) => {
      // Public can only see published
      if (!user) return { _status: { equals: 'published' } }
      // Authenticated can see all
      return true
    },
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

### Document Status

The `_status` field is auto-injected when drafts are enabled:

- `draft` - Never published
- `published` - Published with no newer drafts
- `changed` - Published but has newer unpublished drafts

## Globals

Globals are single-instance documents (not collections).

```ts
import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'nav',
      type: 'array',
      maxRows: 8,
      fields: [
        {
          name: 'link',
          type: 'relationship',
          relationTo: 'pages',
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
    },
  ],
}
```
