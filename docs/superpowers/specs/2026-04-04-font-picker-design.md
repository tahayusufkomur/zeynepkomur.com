# Font Picker & Size Selector Design

**Date:** 2026-04-04
**Status:** Approved

## Overview

Add per-field font picker and font size selector to all editable text across the site. Admin can customize font family (full Google Fonts catalog) and font size (slider) for each individual text field — both `InlineEdit` page content fields and artwork/collection title/description fields.

## 1. Data Storage

### InlineEdit fields (page_content table)

Store style as a sibling row in the existing `page_content` table with a `_style` suffix:

- `pageSlug: "home"`, `sectionKey: "hero_title_style"`, `content: '{"fontFamily":"Playfair Display","fontSize":72}'`
- No schema change needed — reuses existing table
- `InlineEdit` derives the style key from its own `pageSlug` + `sectionKey` + `"_style"`

### Artwork/collection fields (new table)

New table `field_styles`:

- `id` text PK
- `entityType` text ("artwork" | "collection")
- `entityId` text (references artwork or collection ID)
- `fieldName` text ("title" | "description")
- `fontFamily` text
- `fontSize` integer (pixels)
- Unique index on `(entityType, entityId, fieldName)`
- Cascade delete when parent entity is deleted (via application logic — SQLite FK not practical here since entityId references two tables)

### Default behavior

When no style is saved, fields render exactly as they do now (inheriting CSS classes). Custom styles override only font-family and font-size via inline `style` prop.

## 2. Google Fonts Integration

### Font catalog

- Ship a static JSON file (`src/data/google-fonts.json`) containing ~1500 popular Google Fonts (name + category + variants)
- No API key required — font catalog is static public data
- Admin searches from this local list in the font picker dropdown

### Font loading (admin editing)

- When admin selects a font in the picker, dynamically inject `<link href="https://fonts.googleapis.com/css2?family=...">` into `<head>`
- Font preview in dropdown: each option rendered in its own font (loaded on demand as user scrolls/searches)

### Font loading (visitors)

- Each page's server component collects all custom fonts used on that page
- Renders a single `<link>` tag to preload all needed Google Fonts
- Utility in `src/lib/fonts.ts`:
  - `getUsedFonts(pageSlug: string)` — queries `page_content` style rows for a page
  - `getEntityFonts(entityType, entityIds)` — queries `field_styles` for entities
  - `buildGoogleFontsUrl(families: string[])` — builds combined URL like `https://fonts.googleapis.com/css2?family=Playfair+Display&family=Cormorant`
- Zero JS overhead for font customization on visitor side

### API route

`GET /api/fonts` — returns the font catalog JSON. Loaded once by the toolbar, cached in React state for the session.

## 3. Floating Toolbar UI

### Component

`src/components/admin/text-style-toolbar.tsx`

### When it appears

- Admin is in edit mode
- Clicks/focuses on any editable text field
- Small toolbar appears above the field (below if near top of viewport)
- Disappears when field loses focus or admin clicks elsewhere

### Toolbar contents (left to right)

1. **Font picker**: searchable dropdown, font names previewed in their own font, filters as you type. Shows current font or "varsayilan" (default) if none set
2. **Size slider**: range input (12px–120px), current value displayed as number. Dragging updates text live
3. **Reset button**: small "x" icon to clear custom style and return to default

### Props

```typescript
type TextStyleToolbarProps = {
  fontFamily: string | null;
  fontSize: number | null;
  onChange: (style: { fontFamily: string | null; fontSize: number | null }) => void;
  onReset: () => void;
};
```

### Live preview

As admin changes font or drags slider, text updates immediately via local state. Saved to DB on blur/toolbar-close, same pattern as `InlineEdit` content saves.

## 4. Integration with Existing Components

### InlineEdit changes

- Fetches its style on mount from `page_content` (key: `{sectionKey}_style`)
- Applies `style={{ fontFamily, fontSize }}` on the rendered `<Tag>`
- Shows `TextStyleToolbar` when in edit mode and field is focused/active
- Saves style to `/api/content` with the `_style` suffix key on blur/toolbar-close

### Artwork/collection fields

- New component: `src/components/admin/styleable-text.tsx`
  - Wraps any text element with optional custom style + toolbar in edit mode
  - Props: `entityType`, `entityId`, `fieldName`, `as` (tag), `className`, `children`
  - Reads style from `field_styles` (passed as prop from server component)
  - In edit mode: shows toolbar on hover/focus, saves via new API endpoint
- Used in: artwork cards, artwork detail page, collection templates
- Server components fetch styles from `field_styles` and pass them down

### New API endpoint

`PUT /api/field-styles` — upsert style for an entity field

- Body: `{ entityType, entityId, fieldName, fontFamily, fontSize }`
- Requires admin auth
- `DELETE /api/field-styles` — reset style for an entity field
- Body: `{ entityType, entityId, fieldName }`

## Architecture Notes

### Files to create

- `src/data/google-fonts.json` — static font catalog (~1500 fonts)
- `src/components/admin/text-style-toolbar.tsx` — floating toolbar component
- `src/components/admin/styleable-text.tsx` — wrapper for artwork/collection text
- `src/lib/fonts.ts` — font utility functions
- `src/app/api/fonts/route.ts` — font catalog API
- `src/app/api/field-styles/route.ts` — field style CRUD API

### Files to modify

- `src/lib/db/schema.ts` — add `fieldStyles` table
- `src/lib/db/migrate.ts` — create `field_styles` table
- `src/components/admin/inline-edit.tsx` — add style fetching, toolbar, style application
- `src/app/page.tsx` — preload fonts for homepage
- `src/app/galeri/page.tsx` — preload fonts for gallery
- `src/app/eser/[slug]/page.tsx` — preload fonts for artwork detail
- `src/app/koleksiyon/[slug]/page.tsx` — preload fonts for collection pages
- `src/app/koleksiyon/page.tsx` — preload fonts for collection listing
- `src/components/artwork/artwork-card.tsx` — use `StyleableText` for title/description
- `src/app/eser/[slug]/artwork-detail-client.tsx` — use `StyleableText`
- `src/components/collection/template-grid.tsx` — use `StyleableText`
- `src/components/collection/template-showcase.tsx` — use `StyleableText`
- `src/components/collection/template-challenge.tsx` — use `StyleableText`
