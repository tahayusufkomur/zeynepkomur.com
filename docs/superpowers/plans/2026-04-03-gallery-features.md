# Gallery & Artwork Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add artwork detail pages, gallery ordering, hero picker, collection listing, and gallery filters.

**Architecture:** Incremental additions to existing Next.js app with SQLite/Drizzle. Server components for pages, client components for admin modals. All new features follow existing patterns (inline edit, admin toolbar buttons, page_content storage).

**Tech Stack:** Next.js 16, React, Drizzle ORM, better-sqlite3, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-03-gallery-features-design.md`

---

## Chunk 1: Foundation (slug utility, migration, schema)

### Task 1: Create slugify utility

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create `src/lib/utils.ts` with `slugifyTitle()`**

```typescript
const TURKISH_MAP: Record<string, string> = {
  ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
  ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
};

export function slugifyTitle(title: string): string {
  let s = title;
  for (const [from, to] of Object.entries(TURKISH_MAP)) {
    s = s.replaceAll(from, to);
  }
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add slugifyTitle utility with Turkish transliteration"
```

### Task 2: Add slug column to database

**Files:**
- Modify: `src/lib/db/migrate.ts`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Add slug column to migration**

In `src/lib/db/migrate.ts`:

First, add import at the top of the file:
```typescript
import { slugifyTitle } from "../utils";
```

Then, **before** `sqlite.close()` (before line 104), add:

```typescript
// Add slug column to artworks (idempotent)
const columns = sqlite.pragma("table_info(artworks)") as { name: string }[];
if (!columns.some((c) => c.name === "slug")) {
  sqlite.exec(`ALTER TABLE artworks ADD COLUMN slug TEXT DEFAULT ''`);
  // Backfill slugs for existing artworks
  const rows = sqlite.prepare("SELECT id, title FROM artworks").all() as { id: string; title: string }[];
  const update = sqlite.prepare("UPDATE artworks SET slug = ? WHERE id = ?");
  const seen = new Set<string>();
  for (const row of rows) {
    let slug = slugifyTitle(row.title);
    if (!slug) slug = "eser";
    const base = slug;
    let i = 1;
    while (seen.has(slug)) {
      slug = `${base}-${i++}`;
    }
    seen.add(slug);
    update.run(slug, row.id);
  }
  // Now make it unique (SQLite requires index for unique constraint on existing column)
  sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS artworks_slug_unique ON artworks(slug)`);
}
```

- [ ] **Step 2: Add slug to Drizzle schema**

In `src/lib/db/schema.ts`, add slug field to artworks table after `imagePath`:

```typescript
slug: text("slug").notNull().default(""),
```

- [ ] **Step 3: Verify migration runs**

```bash
npx tsx -e "require('./src/lib/db/migrate').migrate()"
```

Expected: `[migrate] Tables created/verified` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/migrate.ts src/lib/db/schema.ts
git commit -m "feat: add slug column to artworks with backfill migration"
```

### Task 3: Generate slugs in artwork API

**Files:**
- Modify: `src/app/api/artworks/route.ts`
- Modify: `src/app/api/artworks/[id]/route.ts`

- [ ] **Step 1: Update POST `/api/artworks` to generate slug**

In `src/app/api/artworks/route.ts`, add import at top:

```typescript
import { slugifyTitle } from "@/lib/utils";
```

In the POST handler, before `db.insert(artworks).values(...)`, generate a unique slug:

```typescript
let slug = slugifyTitle(body.title) || "eser";
// Ensure uniqueness
const existing = await db.select({ slug: artworks.slug }).from(artworks);
const taken = new Set(existing.map((r) => r.slug));
const base = slug;
let i = 1;
while (taken.has(slug)) {
  slug = `${base}-${i++}`;
}
```

Add `slug` to the `.values({...})` object.

- [ ] **Step 2: Update PUT `/api/artworks/[id]` to regenerate slug on title change**

In `src/app/api/artworks/[id]/route.ts`, add import:

```typescript
import { slugifyTitle } from "@/lib/utils";
import { ne } from "drizzle-orm";
```

In the PUT handler, after extracting `artworkFields` from body, if title changed generate new slug:

```typescript
if (artworkFields.title) {
  let slug = slugifyTitle(artworkFields.title) || "eser";
  const existing = await db
    .select({ slug: artworks.slug })
    .from(artworks)
    .where(ne(artworks.id, id));
  const taken = new Set(existing.map((r) => r.slug));
  const base = slug;
  let i = 1;
  while (taken.has(slug)) {
    slug = `${base}-${i++}`;
  }
  artworkFields.slug = slug;
}
```

- [ ] **Step 3: Add slug to Artwork type**

In `src/components/artwork/artwork-card.tsx`, add `slug: string;` to the `Artwork` type.

- [ ] **Step 4: Build to verify**

```bash
npx next build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/artworks/route.ts src/app/api/artworks/[id]/route.ts src/components/artwork/artwork-card.tsx
git commit -m "feat: auto-generate artwork slugs on create and update"
```

---

## Chunk 2: Artwork Detail Page

### Task 4: Create artwork detail page

**Files:**
- Create: `src/app/eser/[slug]/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/eser/[slug]/page.tsx`:

```typescript
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { artworks, collectionArtworks, collections } from "@/lib/db/schema";
import { eq, ne, and, inArray, asc } from "drizzle-orm";
import { attachImages } from "@/lib/db/artwork-with-images";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import type { Artwork } from "@/components/artwork/artwork-card";
import type { Metadata } from "next";
import { ArtworkDetailClient } from "./artwork-detail-client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [artwork] = await db.select().from(artworks).where(eq(artworks.slug, slug));
  if (!artwork) return { title: "Eser Bulunamadı" };
  return {
    title: `${artwork.title} — Zeynep Kömür`,
    description: artwork.description,
    openGraph: { images: [artwork.imagePath] },
  };
}

export default async function EserPage({ params }: Props) {
  const { slug } = await params;
  const [artworkRow] = await db.select().from(artworks).where(eq(artworks.slug, slug));
  if (!artworkRow) notFound();

  const [artwork] = (await attachImages([artworkRow])) as Artwork[];

  // Find related artworks: same collection first, then same category
  let related: Artwork[] = [];

  // Check if artwork belongs to any collection
  const collectionLinks = await db
    .select({ collectionId: collectionArtworks.collectionId })
    .from(collectionArtworks)
    .where(eq(collectionArtworks.artworkId, artwork.id));

  if (collectionLinks.length > 0) {
    const collectionId = collectionLinks[0].collectionId;
    const siblingIds = await db
      .select({ artworkId: collectionArtworks.artworkId })
      .from(collectionArtworks)
      .where(
        and(
          eq(collectionArtworks.collectionId, collectionId),
          ne(collectionArtworks.artworkId, artwork.id)
        )
      );
    if (siblingIds.length > 0) {
      const rows = await db
        .select()
        .from(artworks)
        .where(inArray(artworks.id, siblingIds.map((s) => s.artworkId)));
      related = (await attachImages(rows)) as Artwork[];
    }
  }

  // Fall back to same category if not enough related
  if (related.length < 4) {
    const categoryRows = await db
      .select()
      .from(artworks)
      .where(
        and(
          eq(artworks.category, artwork.category),
          ne(artworks.id, artwork.id)
        )
      );
    const categoryArtworks = (await attachImages(categoryRows)) as Artwork[];
    const existingIds = new Set(related.map((r) => r.id));
    for (const a of categoryArtworks) {
      if (!existingIds.has(a.id) && related.length < 4) {
        related.push(a);
      }
    }
  }

  related = related.slice(0, 4);

  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="" navItems={navItems} />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-8 pb-24">
        {/* Breadcrumb */}
        <nav className="py-6 text-sm text-on-surface-variant lowercase tracking-wider">
          <Link href="/galeri" className="hover:text-primary transition-colors">galeri</Link>
          <span className="mx-2">/</span>
          <Link href={`/galeri?category=${artwork.category}`} className="hover:text-primary transition-colors">{artwork.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">{artwork.title}</span>
        </nav>

        <ArtworkDetailClient artwork={artwork} related={related} />
      </main>
      <Footer content={footerContent} />
    </div>
  );
}
```

- [ ] **Step 2: Create the client component**

Create `src/app/eser/[slug]/artwork-detail-client.tsx`:

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/components/artwork/artwork-card";

type Props = {
  artwork: Artwork;
  related: Artwork[];
};

export function ArtworkDetailClient({ artwork, related }: Props) {
  const allImages = [
    { imagePath: artwork.imagePath, id: "cover" },
    ...artwork.images,
  ];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      {/* Main content: two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
        {/* Left: Image gallery */}
        <div>
          <div className="aspect-[3/4] relative bg-surface-container-low overflow-hidden mb-4">
            <img
              src={allImages[activeIndex].imagePath}
              alt={artwork.title}
              className="w-full h-full object-cover"
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                    i === activeIndex ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img.imagePath} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Artwork info */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface lowercase mb-4">
            {artwork.title}
          </h1>
          <p className="text-lg text-on-surface-variant lowercase mb-8">
            {artwork.description}
          </p>

          <dl className="space-y-4 mb-10">
            {artwork.dimensions && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24">boyut</dt>
                <dd className="text-on-surface lowercase">{artwork.dimensions}</dd>
              </div>
            )}
            {artwork.technique && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24">teknik</dt>
                <dd className="text-on-surface lowercase">{artwork.technique}</dd>
              </div>
            )}
            {artwork.year && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24">yıl</dt>
                <dd className="text-on-surface">{artwork.year}</dd>
              </div>
            )}
          </dl>

          <Link
            href="/iletisim"
            className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 lowercase w-fit"
          >
            <span className="material-symbols-outlined text-lg">mail</span>
            fiyat için iletişime geçin
          </Link>
        </div>
      </div>

      {/* Related artworks */}
      {related.length > 0 && (
        <section className="border-t border-surface-container pt-16">
          <h2 className="text-3xl font-bold tracking-tighter text-on-surface lowercase mb-10">
            benzer eserler
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {related.map((art) => (
              <Link key={art.id} href={`/eser/${art.slug}`} className="group flex flex-col bg-background border border-surface-container-highest/50">
                <div className="aspect-[3/4] overflow-hidden bg-surface-container">
                  <img
                    src={art.imagePath}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-on-surface leading-tight lowercase">{art.title}</h3>
                  <p className="text-sm text-on-surface-variant">{art.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 3: Build to verify**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/eser/
git commit -m "feat: add artwork detail page at /eser/[slug]"
```

### Task 5: Link artwork cards to detail pages

**Files:**
- Modify: `src/components/artwork/artwork-card.tsx`
- Modify: `src/app/home-artwork-overlay.tsx`
- Modify: `src/components/collection/template-grid.tsx`
- Modify: `src/components/collection/template-showcase.tsx`
- Modify: `src/components/collection/template-challenge.tsx`

- [ ] **Step 1: Update ArtworkCard to link to detail page**

In `src/components/artwork/artwork-card.tsx`:

- Add `import Link from "next/link";` at top.
- Replace the outer `<div>` wrapping the image+text with a `<Link>` when not in edit mode.
- The click handler in edit mode should remain (opens edit modal).
- In non-edit, non-onClick mode, wrap the image container in `<Link href={/eser/${artwork.slug}}>`.

Specifically, change the image `<div>` onClick logic (line 58-66):

```typescript
onClick={() => {
  if (isEditing && onEdit) {
    onEdit(artwork);
  } else if (onClick) {
    onClick(artwork);
  }
}}
```

Wrap the entire card in a Link when not editing. The approach: make the outer div a Link when `!isEditing`, keep as div when editing.

Replace the outer `<div className="group flex flex-col...">` with conditional rendering:

```typescript
const Wrapper = isEditing ? "div" : Link;
const wrapperProps = isEditing ? {} : { href: `/eser/${artwork.slug}` };
```

Then use `<Wrapper {...wrapperProps} className="group flex flex-col bg-background border border-surface-container-highest/50 relative">`.

Remove the `onClick` from the image container div; instead, add `onClick` for edit on the whole card only when editing:

```typescript
{isEditing && onEdit && (
  <div className="absolute inset-0 z-30 cursor-pointer" onClick={() => onEdit(artwork)} />
)}
```

- [ ] **Step 2: Update HomeArtworkOverlay**

In `src/app/home-artwork-overlay.tsx`, when NOT in edit mode, make the div a clickable link to `/eser/[slug]` if artwork is provided.

Add `import Link from "next/link";` at top.

Change the non-editing return (currently returns plain `<div>`). Use `Link` as the wrapper element instead of `div` (children are images/decorative divs, no nested anchor issues):

```typescript
if (!isEditing || !artwork) {
  if (artwork) {
    return <Link href={`/eser/${artwork.slug}`} className={className}>{children}</Link>;
  }
  return <div className={className}>{children}</div>;
}
```

- [ ] **Step 3: Update template-grid.tsx**

In `src/components/collection/template-grid.tsx`, add `import Link from "next/link";` and wrap each artwork card div in a Link:

Change `<div key={artwork.id} className="group flex flex-col...">` to:
```typescript
<Link key={artwork.id} href={`/eser/${artwork.slug}`} className="group flex flex-col bg-background border border-surface-container-highest/50">
```

Close with `</Link>` instead of `</div>`.

- [ ] **Step 4: Update template-showcase.tsx**

In `src/components/collection/template-showcase.tsx`, add `import Link from "next/link";`.

Wrap hero artwork (line 35 `<div className="mb-10 relative group...">`) in:
```typescript
<Link href={`/eser/${hero.slug}`} className="mb-10 relative group overflow-hidden block">
```

Wrap each bento grid item (line 53 `<div key={artwork.id}...>`) in:
```typescript
<Link key={artwork.id} href={`/eser/${artwork.slug}`} className={`group overflow-hidden bg-surface-container relative ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
```

- [ ] **Step 5: Update template-challenge.tsx**

In `src/components/collection/template-challenge.tsx`, add `import Link from "next/link";`.

Wrap each `<article key={artwork.id}>` (line 80) in a Link:
```typescript
<Link key={artwork.id} href={`/eser/${artwork.slug}`} className="group block">
  <article>
```

Or change `<article>` itself to use Link as wrapper. Since article is semantic, wrap the inner content:

Replace `<article key={artwork.id} className="group">` with:
```typescript
<article key={artwork.id} className="group">
  <Link href={`/eser/${artwork.slug}`} className="block">
```

And close the Link before closing article. The entire clickable area (image + text) should be within the Link.

- [ ] **Step 6: Build to verify**

```bash
npx next build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/artwork/artwork-card.tsx src/app/home-artwork-overlay.tsx src/components/collection/template-grid.tsx src/components/collection/template-showcase.tsx src/components/collection/template-challenge.tsx
git commit -m "feat: link all artwork cards to /eser/[slug] detail pages"
```

---

## Chunk 3: Admin Modals (Gallery Reorder + Hero Picker)

### Task 6: Create gallery reorder modal

**Files:**
- Create: `src/components/admin/artwork-reorder-modal.tsx`
- Modify: `src/components/layout/admin-toolbar.tsx`

- [ ] **Step 1: Create the reorder modal**

Create `src/components/admin/artwork-reorder-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { showToast } from "@/components/admin/toast";
import type { Artwork } from "@/components/artwork/artwork-card";

type Props = {
  artworks: Artwork[];
  onClose: () => void;
  onSaved: () => void;
};

export function ArtworkReorderModal({ artworks: initial, onClose, onSaved }: Props) {
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);

  function moveUp(index: number) {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = items.map((item, i) => ({ id: item.id, sortOrder: i }));
      const res = await fetch("/api/artworks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showToast("sıralama güncellendi", "success");
      onSaved();
    } catch {
      showToast("sıralama güncellenemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">eserleri sırala</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container transition-colors">
              <img src={item.imagePath} alt="" className="w-12 h-12 object-cover flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-on-surface lowercase truncate">
                {item.title}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">arrow_upward</span>
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === items.length - 1}
                  className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">arrow_downward</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 px-8 py-6 border-t border-surface-container">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50"
          >
            {saving ? "kaydediliyor..." : "kaydet"}
          </button>
          <button
            onClick={onClose}
            className="border border-outline-variant text-on-surface px-8 py-3 font-bold tracking-tight hover:bg-surface-container transition-all duration-300"
          >
            iptal
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add reorder button to admin toolbar**

In `src/components/layout/admin-toolbar.tsx`:

Add imports at top:
```typescript
import { ArtworkReorderModal } from "@/components/admin/artwork-reorder-modal";
```

Add state (alongside existing `showCollections` state):
```typescript
const [showReorder, setShowReorder] = useState(false);
const [reorderArtworks, setReorderArtworks] = useState<Artwork[]>([]);
```

Add a new button after the `koleksiyonlar` button (after line 150), same style:
```typescript
<button
  onClick={async () => {
    setOpen(false);
    const res = await fetch("/api/artworks");
    const data = await res.json();
    setReorderArtworks(data);
    setShowReorder(true);
  }}
  className="flex items-center gap-3 px-3 py-2.5 text-sm lowercase tracking-tight text-inverse-on-surface/80 hover:bg-white/10 hover:text-white transition-colors w-full"
>
  <span className="material-symbols-outlined text-lg">swap_vert</span>
  <span className="flex-1 text-left">eserleri sırala</span>
</button>
```

Add the modal render next to existing CollectionManagerModal:
```typescript
{showReorder && (
  <ArtworkReorderModal
    artworks={reorderArtworks}
    onClose={() => setShowReorder(false)}
    onSaved={() => {
      setShowReorder(false);
      router.refresh();
    }}
  />
)}
```

Import `Artwork` type and `useRouter` if not already present.

- [ ] **Step 3: Build to verify**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/artwork-reorder-modal.tsx src/components/layout/admin-toolbar.tsx
git commit -m "feat: add gallery artwork reorder modal in admin toolbar"
```

### Task 7: Create hero picker modal and API

**Files:**
- Create: `src/app/api/home/hero/route.ts`
- Create: `src/components/admin/hero-picker-modal.tsx`
- Modify: `src/components/layout/admin-toolbar.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create hero API endpoint**

Create `src/app/api/home/hero/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageContent, artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { and, eq, inArray, sql } from "drizzle-orm";

export async function GET() {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "home"),
        eq(pageContent.sectionKey, "hero_artworks")
      )
    );
  if (!row) return NextResponse.json({ artworkIds: [] });
  try {
    return NextResponse.json({ artworkIds: JSON.parse(row.content) });
  } catch {
    return NextResponse.json({ artworkIds: [] });
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { artworkIds } = await request.json();

  if (!Array.isArray(artworkIds) || artworkIds.length !== 3) {
    return NextResponse.json({ error: "Exactly 3 artwork IDs required" }, { status: 400 });
  }

  // Validate all IDs exist
  const found = await db
    .select({ id: artworks.id })
    .from(artworks)
    .where(inArray(artworks.id, artworkIds));
  if (found.length !== 3) {
    return NextResponse.json({ error: "One or more artwork IDs not found" }, { status: 400 });
  }

  // Upsert into page_content
  const content = JSON.stringify(artworkIds);
  const existing = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "home"),
        eq(pageContent.sectionKey, "hero_artworks")
      )
    );

  if (existing.length > 0) {
    await db
      .update(pageContent)
      .set({ content, updatedAt: sql`(datetime('now'))` })
      .where(eq(pageContent.id, existing[0].id));
  } else {
    await db.insert(pageContent).values({
      pageSlug: "home",
      sectionKey: "hero_artworks",
      content,
    });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create hero picker modal**

Create `src/components/admin/hero-picker-modal.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/admin/toast";
import type { Artwork } from "@/components/artwork/artwork-card";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export function HeroPickerModal({ onClose, onSaved }: Props) {
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [artRes, heroRes] = await Promise.all([
        fetch("/api/artworks"),
        fetch("/api/home/hero"),
      ]);
      const arts = await artRes.json();
      const { artworkIds } = await heroRes.json();
      setAllArtworks(arts);
      setSelected(artworkIds || []);
      setLoading(false);
    }
    load();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === selected.length - 1) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (selected.length !== 3) {
      showToast("lütfen tam 3 eser seçin", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/home/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkIds: selected }),
      });
      if (!res.ok) throw new Error();
      showToast("ana sayfa görselleri güncellendi", "success");
      onSaved();
    } catch {
      showToast("kaydedilemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  const selectedArtworks = selected
    .map((id) => allArtworks.find((a) => a.id === id))
    .filter(Boolean) as Artwork[];

  const slotLabels = ["ana görsel", "dikey kart", "alt kart"];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">ana sayfa görselleri</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          </div>
        ) : (
          <>
            {/* Selected slots */}
            <div className="px-8 py-6 border-b border-surface-container">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                seçili eserler ({selected.length}/3)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((slot) => {
                  const art = selectedArtworks[slot];
                  return (
                    <div key={slot} className="aspect-[4/3] bg-surface-container-low border-2 border-dashed border-outline-variant relative overflow-hidden">
                      {art ? (
                        <>
                          <img src={art.imagePath} alt={art.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                            {slot > 0 && (
                              <button onClick={() => moveUp(slot)} className="bg-white w-7 h-7 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                              </button>
                            )}
                            <button onClick={() => toggle(art.id)} className="bg-white text-error w-7 h-7 flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                            {slot < selected.length - 1 && (
                              <button onClick={() => moveDown(slot)} className="bg-white w-7 h-7 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-2 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">{slotLabels[slot]}</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-outline-variant">{slotLabels[slot]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All artworks grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {allArtworks.map((art) => {
                  const isSelected = selected.includes(art.id);
                  return (
                    <button
                      key={art.id}
                      onClick={() => toggle(art.id)}
                      className={`aspect-square overflow-hidden relative border-2 transition-colors ${
                        isSelected ? "border-primary" : "border-transparent hover:border-outline-variant"
                      }`}
                    >
                      <img src={art.imagePath} alt={art.title} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 left-1 bg-primary text-on-primary w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                          {selected.indexOf(art.id) + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-4 px-8 py-6 border-t border-surface-container">
          <button
            onClick={handleSave}
            disabled={saving || selected.length !== 3}
            className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50"
          >
            {saving ? "kaydediliyor..." : "kaydet"}
          </button>
          <button
            onClick={onClose}
            className="border border-outline-variant text-on-surface px-8 py-3 font-bold tracking-tight hover:bg-surface-container transition-all duration-300"
          >
            iptal
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add hero picker button to admin toolbar**

In `src/components/layout/admin-toolbar.tsx`:

Add import:
```typescript
import { HeroPickerModal } from "@/components/admin/hero-picker-modal";
```

Add state:
```typescript
const [showHeroPicker, setShowHeroPicker] = useState(false);
```

Add button after the reorder button (same style):
```typescript
<button
  onClick={() => {
    setOpen(false);
    setShowHeroPicker(true);
  }}
  className="flex items-center gap-3 px-3 py-2.5 text-sm lowercase tracking-tight text-inverse-on-surface/80 hover:bg-white/10 hover:text-white transition-colors w-full"
>
  <span className="material-symbols-outlined text-lg">home</span>
  <span className="flex-1 text-left">ana sayfa görselleri</span>
</button>
```

Add modal render:
```typescript
{showHeroPicker && (
  <HeroPickerModal
    onClose={() => setShowHeroPicker(false)}
    onSaved={() => {
      setShowHeroPicker(false);
      router.refresh();
    }}
  />
)}
```

- [ ] **Step 4: Update homepage to read hero selection**

In `src/app/page.tsx`, replace the hero artwork fetch (lines 43-49):

```typescript
// Fetch hero artworks (from admin selection or fallback to latest 3)
let latestArtworks: Artwork[] = [];
const [heroRow] = await db
  .select()
  .from(pageContent)
  .where(
    and(
      eq(pageContent.pageSlug, "home"),
      eq(pageContent.sectionKey, "hero_artworks")
    )
  );

if (heroRow) {
  try {
    const heroIds: string[] = JSON.parse(heroRow.content);
    if (heroIds.length === 3) {
      const rows = await db
        .select()
        .from(artworks)
        .where(inArray(artworks.id, heroIds));
      const withImages = (await attachImages(rows)) as Artwork[];
      // Preserve the order from heroIds
      latestArtworks = heroIds
        .map((id) => withImages.find((a) => a.id === id))
        .filter(Boolean) as Artwork[];
    }
  } catch {}
}

// Fallback to latest 3
if (latestArtworks.length < 3) {
  const rawLatest = await db
    .select()
    .from(artworks)
    .orderBy(desc(artworks.createdAt))
    .limit(3);
  latestArtworks = (await attachImages(rawLatest)) as Artwork[];
}
```

Add necessary imports: `and`, `inArray` from drizzle-orm, `pageContent` from schema.

- [ ] **Step 5: Build to verify**

```bash
npx next build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/home/ src/components/admin/hero-picker-modal.tsx src/components/layout/admin-toolbar.tsx src/app/page.tsx
git commit -m "feat: add hero artwork picker modal and API"
```

---

## Chunk 4: Collection Listing + Gallery Filters + Navbar

### Task 8: Create collection listing page

**Files:**
- Create: `src/app/koleksiyon/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/koleksiyon/page.tsx`:

```typescript
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { collections, collectionArtworks, artworks } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import Link from "next/link";

export default async function KoleksiyonlarPage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  const allCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.isPublished, true))
    .orderBy(asc(collections.createdAt));

  // Get first artwork image and count for each collection
  const collectionData = await Promise.all(
    allCollections.map(async (col) => {
      const items = await db
        .select({ artworkId: collectionArtworks.artworkId })
        .from(collectionArtworks)
        .where(eq(collectionArtworks.collectionId, col.id))
        .orderBy(asc(collectionArtworks.sortOrder));

      let coverImage: string | null = null;
      if (items.length > 0) {
        const [first] = await db
          .select({ imagePath: artworks.imagePath })
          .from(artworks)
          .where(eq(artworks.id, items[0].artworkId));
        coverImage = first?.imagePath ?? null;
      }

      return { ...col, coverImage, artworkCount: items.length };
    })
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="koleksiyonlar" navItems={navItems} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-8 pb-24">
        <header className="py-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-on-surface lowercase">
            koleksiyonlar
          </h1>
          <div className="h-1.5 w-32 mt-6" style={{ backgroundColor: "#ffd709" }} />
        </header>

        {collectionData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant text-lg lowercase">
            henüz yayınlanmış koleksiyon bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {collectionData.map((col) => (
              <Link
                key={col.id}
                href={`/koleksiyon/${col.slug}`}
                className="group flex flex-col bg-background border border-surface-container-highest/50 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-container">
                  {col.coverImage ? (
                    <img
                      src={col.coverImage}
                      alt={col.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline/20 text-7xl">collections_bookmark</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-on-surface lowercase mb-2">{col.title}</h2>
                  {col.description && (
                    <p className="text-sm text-on-surface-variant lowercase line-clamp-2">{col.description}</p>
                  )}
                  <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-primary">
                    {col.artworkCount} eser
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer content={footerContent} />
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/koleksiyon/page.tsx
git commit -m "feat: add collection listing page at /koleksiyon"
```

### Task 9: Add koleksiyonlar to navbar

**Files:**
- Modify: `src/lib/get-navbar-content.ts`

- [ ] **Step 1: Add koleksiyonlar to DEFAULT_NAV**

In `src/lib/get-navbar-content.ts`, add to `DEFAULT_NAV` array after the `galeri` entry:

```typescript
{ key: "koleksiyonlar", href: "/koleksiyon", label: "koleksiyonlar", page: "koleksiyonlar", hidden: false },
```

- [ ] **Step 2: Build to verify**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/get-navbar-content.ts
git commit -m "feat: add koleksiyonlar link to navbar"
```

### Task 10: Wire gallery filters

**Files:**
- Modify: `src/components/artwork/filter-bar.tsx`
- Modify: `src/app/galeri/gallery-client.tsx`
- Modify: `src/app/galeri/page.tsx`
- Modify: `src/components/artwork/artwork-card.tsx` (add collectionIds to Artwork type)

- [ ] **Step 1: Add collectionIds to Artwork type**

In `src/components/artwork/artwork-card.tsx`, add to the `Artwork` type:

```typescript
collectionIds?: string[];
```

- [ ] **Step 2: Update filter-bar.tsx**

Replace the entire `src/components/artwork/filter-bar.tsx` with:

```typescript
"use client";

type FilterBarProps = {
  totalCount: number;
  dimensions: string[];
  collections: { id: string; title: string }[];
  selectedDimension: string | null;
  selectedCollection: string | null;
  onDimensionChange: (value: string | null) => void;
  onCollectionChange: (value: string | null) => void;
};

export function FilterBar({
  totalCount,
  dimensions,
  collections,
  selectedDimension,
  selectedCollection,
  onDimensionChange,
  onCollectionChange,
}: FilterBarProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low px-8 py-6 mb-8">
      <div className="flex flex-wrap items-center gap-4">
        {/* Boyut filter */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            boyut
          </label>
          <select
            value={selectedDimension ?? ""}
            onChange={(e) => onDimensionChange(e.target.value || null)}
            className="text-sm bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary text-on-surface lowercase py-1 pr-6 cursor-pointer"
          >
            <option value="">tümü</option>
            {dimensions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Collection filter */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            koleksiyon
          </label>
          <select
            value={selectedCollection ?? ""}
            onChange={(e) => onCollectionChange(e.target.value || null)}
            className="text-sm bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary text-on-surface lowercase py-1 pr-6 cursor-pointer"
          >
            <option value="">tümü</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-on-surface-variant lowercase">
        <span className="font-bold text-on-surface">{totalCount}</span> eser listeleniyor
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update gallery-client.tsx to manage filter state**

Replace `src/app/galeri/gallery-client.tsx` with:

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryBar } from "@/components/artwork/category-bar";
import { FilterBar } from "@/components/artwork/filter-bar";
import { ArtworkGrid } from "@/components/artwork/artwork-grid";
import { ArtworkFormModal } from "@/components/artwork/artwork-form-modal";
import { ArtworkLightbox } from "@/components/artwork/artwork-lightbox";
import type { Artwork } from "@/components/artwork/artwork-card";

type GalleryClientProps = {
  artworks: Artwork[];
  dimensions: string[];
  collections: { id: string; title: string }[];
};

export function GalleryClient({ artworks, dimensions, collections }: GalleryClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [viewingArtwork, setViewingArtwork] = useState<Artwork | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  let filtered = artworks;

  if (activeCategory) {
    filtered = filtered.filter((a) => a.category === activeCategory);
  }
  if (selectedDimension) {
    filtered = filtered.filter((a) => a.dimensions === selectedDimension);
  }
  if (selectedCollection) {
    filtered = filtered.filter((a) => a.collectionIds?.includes(selectedCollection));
  }

  function handleSaved() {
    setEditingArtwork(null);
    setShowCreate(false);
    router.refresh();
  }

  return (
    <>
      <CategoryBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <FilterBar
        totalCount={filtered.length}
        dimensions={dimensions}
        collections={collections}
        selectedDimension={selectedDimension}
        selectedCollection={selectedCollection}
        onDimensionChange={setSelectedDimension}
        onCollectionChange={setSelectedCollection}
      />
      <ArtworkGrid
        artworks={filtered}
        onClick={setViewingArtwork}
        onEdit={setEditingArtwork}
        onDelete={async (id) => {
          if (!confirm("Bu eseri silmek istediğinize emin misiniz?")) return;
          await fetch(`/api/artworks/${id}`, { method: "DELETE" });
          router.refresh();
        }}
        onAddNew={() => setShowCreate(true)}
      />

      {viewingArtwork && (
        <ArtworkLightbox
          artwork={viewingArtwork}
          onClose={() => setViewingArtwork(null)}
        />
      )}

      {editingArtwork && (
        <ArtworkFormModal
          artwork={editingArtwork}
          onClose={() => setEditingArtwork(null)}
          onSaved={handleSaved}
        />
      )}

      {showCreate && (
        <ArtworkFormModal
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
```

- [ ] **Step 4: Update galeri/page.tsx to fetch filter data**

In `src/app/galeri/page.tsx`, add imports:

```typescript
import { collections, collectionArtworks } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
```

After `const allArtworks = await attachImages(rawArtworks);`, add:

```typescript
// Fetch distinct dimensions for filter
const distinctDimensions = [...new Set(
  rawArtworks.map((a) => a.dimensions).filter((d) => d && d.trim() !== "")
)].sort();

// Fetch published collections for filter
const publishedCollections = await db
  .select({ id: collections.id, title: collections.title })
  .from(collections)
  .where(eq(collections.isPublished, true));

// Attach collectionIds to each artwork
const allCollectionLinks = await db
  .select({
    artworkId: collectionArtworks.artworkId,
    collectionId: collectionArtworks.collectionId,
  })
  .from(collectionArtworks);

const collectionMap = new Map<string, string[]>();
for (const link of allCollectionLinks) {
  const ids = collectionMap.get(link.artworkId) ?? [];
  ids.push(link.collectionId);
  collectionMap.set(link.artworkId, ids);
}

const artworksWithCollections = allArtworks.map((a) => ({
  ...a,
  collectionIds: collectionMap.get(a.id) ?? [],
}));
```

Update the `GalleryClient` render to pass new props. Wrap in `<Suspense>` since `gallery-client.tsx` uses `useSearchParams()`:

```typescript
import { Suspense } from "react";
```

```typescript
<Suspense fallback={null}>
  <GalleryClient
    artworks={artworksWithCollections}
    dimensions={distinctDimensions}
    collections={publishedCollections}
  />
</Suspense>
```

- [ ] **Step 5: Build to verify**

```bash
npx next build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/artwork/filter-bar.tsx src/app/galeri/gallery-client.tsx src/app/galeri/page.tsx src/components/artwork/artwork-card.tsx
git commit -m "feat: wire gallery filters for dimensions and collections"
```

---

## Chunk 5: Final Verification

### Task 11: Full build and smoke check

- [ ] **Step 1: Run full build**

```bash
npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Start dev server and verify pages**

```bash
npx next dev
```

Verify these routes load without errors:
- `/` — homepage with hero artworks
- `/galeri` — gallery with filters working
- `/eser/[any-slug]` — artwork detail page
- `/koleksiyon` — collection listing
- `/koleksiyon/[any-slug]` — individual collection

- [ ] **Step 3: Verify admin features**

- Login as admin
- Toggle edit mode
- Open "eserleri sırala" modal, reorder, save
- Open "ana sayfa görselleri" modal, pick 3, save
- Verify homepage updates with selected artworks

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
