# Gallery & Artwork Features Design

**Date:** 2026-04-03
**Status:** Approved

## Overview

Five features to improve artwork management, discoverability, and browsing:

1. Admin gallery ordering UI
2. Admin hero section artwork picker
3. Individual artwork detail pages (`/eser/[slug]`)
4. Collection listing page (`/koleksiyon`)
5. Gallery filters for dimensions and collections

## Prerequisites

Database migration (slug column) must complete before features 2-6 can be implemented. The slug utility and migration are the first implementation step.

## 1. Database Changes

### Add `slug` to artworks table

Add column: `slug: text("slug").notNull().unique()`

- Create a dedicated `slugifyTitle()` utility in `src/lib/utils.ts` that transliterates Turkish characters to ASCII (ş→s, ö→o, ü→u, ı→i, ğ→g, ç→c) for clean URL slugs
- Migration uses `ALTER TABLE artworks ADD COLUMN slug TEXT` with idempotency guard via `PRAGMA table_info`
- Backfills existing artworks by slugifying their titles with UUID suffix for uniqueness
- Artwork creation/update API generates slug from title if not provided

### Hero artwork selection via page_content

Store hero artwork IDs in the existing `page_content` table:

- `pageSlug: "home"`, `sectionKey: "hero_artworks"`
- Content: JSON string of ordered artwork IDs, e.g. `["id1", "id2", "id3"]`
- Homepage reads this instead of `orderBy(desc(createdAt)).limit(3)`
- Falls back to latest 3 if no hero selection exists (backward compatible)

No new tables required.

## 2. Artwork Detail Page

### Route

`src/app/eser/[slug]/page.tsx` — server component

### Layout

- Full-width hero image (cover image)
- Two-column layout on desktop, stacked on mobile:
  - **Left:** Image gallery with thumbnail strip, click to view larger
  - **Right:** Artwork info — title, description, dimensions, technique, year, availability, "iletisime gecin" CTA button
- **Related artworks** section below: up to 4 artworks from the same collection (if any), falling back to same category. Uses `ArtworkCard` linking to `/eser/[slug]`.
- Breadcrumb: `galeri / [category] / [title]` — links back to gallery with category pre-filtered

### SEO

Dynamic metadata (title, description, og:image) from artwork data.

### Linking changes

All artwork cards across the site become links to `/eser/[slug]`:

- `ArtworkCard` in gallery wraps in `<Link href={/eser/${slug}}>`
- Homepage artwork cards link to `/eser/[slug]`
- Collection templates (`template-grid.tsx`, `template-showcase.tsx`, `template-challenge.tsx`) each render custom inline markup (not `ArtworkCard`), so each needs its own `Link` wrapper added individually
- Admin edit mode preserved: clicking in edit mode still opens the edit modal
- Lightbox remains as a component but is no longer the primary artwork view

## 3. Gallery Ordering (Admin)

### UI

- New "Eserleri Sirala" button in admin toolbar (next to collection manager)
- Opens modal with vertical list of all artworks (thumbnail + title)
- Up/down arrow buttons to reorder (same pattern as collection manager modal)
- Save calls existing `PUT /api/artworks/reorder` endpoint

No backend changes — the reorder API and `sortOrder` column already exist, and gallery already sorts by `sortOrder` ascending. The reorder API expects a flat JSON array: `[{ id: string, sortOrder: number }, ...]`.

## 4. Hero Section Picker (Admin)

### UI

- New "Ana Sayfa Gorselleri" button in admin toolbar
- Opens modal showing all artworks as a selectable thumbnail grid
- Admin picks exactly 3 artworks; order matters:
  - Slot 1: hero banner image AND large bento card (appears in both places, same as current behavior)
  - Slot 2: vertical bento card
  - Slot 3: bottom bento card
- Selected artworks shown at top with ordering (1, 2, 3) and remove buttons

### API

`PUT /api/home/hero`

- Accepts `{ artworkIds: string[] }`
- Validates exactly 3 IDs, all referencing existing artworks
- Writes JSON array to `page_content` (pageSlug: "home", sectionKey: "hero_artworks")

### Homepage changes

- Reads `hero_artworks` from `page_content`
- Fetches those specific artworks by ID, preserving order
- Falls back to latest 3 by `createdAt` if no selection exists

## 5. Collection Listing Page

### Route

`src/app/koleksiyon/page.tsx` — server component

### Layout

- Responsive grid (1/2/3 columns) of published collections
- Each card: cover image (first artwork's image), title, description, artwork count
- Clicking a card navigates to `/koleksiyon/[slug]`
- Same styling conventions as gallery page

### Navigation

- Add "koleksiyonlar" to `DEFAULT_ITEMS` in navbar component and seed it via `page_content` migration (consistent with existing navbar data-driven pattern)

## 6. Gallery Filters

### Wiring the existing filter bar

The filter bar component (`filter-bar.tsx`) already renders dropdowns but they aren't connected. Changes:

- **Boyut (dimensions):** Dropdown populated with distinct `dimensions` values from artworks in DB. Selecting filters to exact text match.
- **Koleksiyon (collection):** Dropdown populated with published collections. Selecting filters to artworks belonging to that collection.
- **Remove "renk" (color) dropdown** — no color data in schema, not in scope. Remove `onColorChange` from `FilterBarProps` type and the hardcoded color options JSX.
- **Category bar** stays as-is (already functional).

### Filter bar props

Update `FilterBarProps` to accept dynamic data:
- `dimensions: string[]` — distinct dimension values from DB
- `collections: { id: string; title: string }[]` — published collections
- `onDimensionChange: (value: string | null) => void`
- `onCollectionChange: (value: string | null) => void`

Replace hardcoded "50x70", "70x100", "ozel boyut" options with the dynamic `dimensions` prop.

### Filter mechanics

- All filters combine with AND logic: category AND dimension AND collection
- Clearing any filter removes that constraint
- Applied client-side since all artworks are already fetched to the gallery client component
- Collection membership: `galeri/page.tsx` runs a parallel query joining `collectionArtworks` to build `collectionIds: string[]` for each artwork, passed alongside `attachImages` result

## Architecture Notes

### Files to create

- `src/lib/utils.ts` — `slugifyTitle()` with Turkish transliteration
- `src/app/eser/[slug]/page.tsx` — artwork detail page
- `src/app/koleksiyon/page.tsx` — collection listing page
- `src/components/admin/artwork-reorder-modal.tsx` — gallery ordering modal
- `src/components/admin/hero-picker-modal.tsx` — hero artwork picker modal
- `src/app/api/home/hero/route.ts` — hero selection API (with `export const dynamic = "force-dynamic"`)

### Files to modify

- `src/lib/db/schema.ts` — add slug column to artworks
- `src/lib/db/migrate.ts` — backfill slugs for existing artworks
- `src/app/api/artworks/route.ts` — generate slug on create
- `src/app/api/artworks/[id]/route.ts` — update slug on title change
- `src/app/page.tsx` — read hero selection from page_content
- `src/components/artwork/artwork-card.tsx` — wrap in Link to `/eser/[slug]`
- `src/components/artwork/filter-bar.tsx` — accept filter props, remove renk
- `src/app/galeri/gallery-client.tsx` — wire filters, pass collection data
- `src/app/galeri/page.tsx` — fetch distinct dimensions and collections for filter options
- `src/components/layout/admin-toolbar.tsx` — add reorder and hero picker buttons
- `src/components/collection/template-grid.tsx` — artwork cards link to `/eser/[slug]`
- `src/components/collection/template-showcase.tsx` — artwork cards link to `/eser/[slug]`
- `src/components/collection/template-challenge.tsx` — artwork cards link to `/eser/[slug]`
- `src/app/home-artwork-overlay.tsx` — link to `/eser/[slug]` in non-edit mode

### Existing infrastructure reused

- `PUT /api/artworks/reorder` — already exists, no changes needed
- `page_content` table — used for hero selection storage
- `attachImages()` helper — used in artwork detail page
- `ArtworkCard` component — extended with Link wrapper
- Admin toolbar pattern — new buttons follow existing collection manager button style
- Up/down reorder pattern — from collection manager modal
