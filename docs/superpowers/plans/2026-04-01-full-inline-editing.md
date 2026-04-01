# Full Inline Editing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the admin to edit every text, image, artwork, and collection on the site directly from the pages — no separate admin dashboard.

**Architecture:** Extend the existing `InlineEdit`/`ImageUpload`/`useAdmin` system. Add delete to `ArtworkFormModal`, build a new `CollectionManagerModal`, and wrap all remaining hardcoded content across all pages with inline editing components. Most API endpoints already exist; one GET handler needs adding.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, Drizzle ORM (SQLite), React Context (EditModeProvider)

**Spec:** `docs/superpowers/specs/2026-04-01-full-inline-editing-design.md`

---

## Chunk 1: Foundation — Seed Data + ArtworkFormModal Enhancement

### Task 1: Fix seed data (slug mismatch + add new entries)

**Files:**
- Modify: `src/lib/db/seed.ts`

**Context:** The seed file has `pageSlug: "about"` but the hakkinda page queries `"hakkinda"`. Also keys `bio_main`/`bio_secondary` should be `bio_1`/`bio_2`. Many new entries are needed for pages that will become editable.

- [ ] **Step 1: Fix existing about entries and add all new seed entries**

Replace the entire `defaults` array in `src/lib/db/seed.ts` with:

```typescript
const defaults = [
  // Home
  { pageSlug: "home", sectionKey: "hero_title", content: "Sınırsız Sanat" },
  { pageSlug: "home", sectionKey: "hero_subtitle", content: "modernizmin sınırlarını zorlayan, renk ve formun dansı." },
  { pageSlug: "home", sectionKey: "new_arrivals_title", content: "yeni gelenler" },
  { pageSlug: "home", sectionKey: "new_arrivals_description", content: "son eklenen eserler ve koleksiyonlar. zeynep kömür seçkisiyle modern sanatın taze soluğu." },
  { pageSlug: "home", sectionKey: "quote_text", content: "Her çocuk bir sanatçıdır. Sorun, büyüdüğümüzde sanatçı kalmayı nasıl başaracağımızdır." },
  { pageSlug: "home", sectionKey: "quote_attribution", content: "Pablo Picasso" },
  // Hakkinda (FIXED: was "about" with wrong keys)
  { pageSlug: "hakkinda", sectionKey: "bio_1", content: "ZEYN'in hikayesi, sanatı sadece seyredilen bir nesne değil, yaşanan bir mekan haline getirme arzusuyla başladı. İstanbul merkezli multidisipliner sanatçı Zeynep Kömür, modern brutalizm ile geleneksel dokuları harmanlayarak dijital kürasyonun sınırlarını yeniden tanımlıyor." },
  { pageSlug: "hakkinda", sectionKey: "bio_2", content: "Mimar Sinan Güzel Sanatlar Üniversitesi mezunu olan Kömür, on yılı aşkın süredir hem yerel hem de uluslararası sergilerde eserlerini sergilemekte ve küratörlük yapmaktadır." },
  { pageSlug: "hakkinda", sectionKey: "skill_1", content: "dijital sanat" },
  { pageSlug: "hakkinda", sectionKey: "skill_2", content: "kürasyon" },
  { pageSlug: "hakkinda", sectionKey: "skill_3", content: "fotoğrafçılık" },
  { pageSlug: "hakkinda", sectionKey: "identity_label", content: "kurucu & küratör" },
  { pageSlug: "hakkinda", sectionKey: "portrait_image", content: "/uploads/pages/portrait.webp" },
  // Contact
  { pageSlug: "contact", sectionKey: "headline", content: "arada bağ kuralım" },
  { pageSlug: "contact", sectionKey: "section_1_title", content: "beraber çalışalım." },
  { pageSlug: "contact", sectionKey: "section_2_title", content: "bana her şeyi sorabilirsin." },
  { pageSlug: "contact", sectionKey: "studio_address", content: "moda, kadıköy, istanbul, türkiye" },
  { pageSlug: "contact", sectionKey: "studio_hours", content: "pazartesi - cumartesi, 10:00 - 19:00" },
  { pageSlug: "contact", sectionKey: "studio_email", content: "merhaba@zeyn.art" },
  { pageSlug: "contact", sectionKey: "studio_social", content: "@zeyn.art" },
  // Galeri
  { pageSlug: "galeri", sectionKey: "quote_text", content: "sanat, görünmeyeni görünür kılmaktır. her fırça darbesi, bir hikayenin başlangıcıdır." },
  { pageSlug: "galeri", sectionKey: "quote_attribution", content: "zeynep kömür" },
  // Ozel-istek
  { pageSlug: "ozel-istek", sectionKey: "headline", content: "özelleştirilmiş resim isteği" },
  { pageSlug: "ozel-istek", sectionKey: "description", content: "mekanınıza ruh katacak, sadece size özel üretilecek bir eser için kürasyon sürecini başlatın." },
  { pageSlug: "ozel-istek", sectionKey: "feature_1_title", content: "renk kürasyonu" },
  { pageSlug: "ozel-istek", sectionKey: "feature_1_desc", content: "mekanınızın ışık ve dokusuna uygun özel pigment seçimi." },
  { pageSlug: "ozel-istek", sectionKey: "feature_2_title", content: "boyut ve oran" },
  { pageSlug: "ozel-istek", sectionKey: "feature_2_desc", content: "duvar ölçülerinize altın oran ile uyumlu özel kanvas üretimi." },
  { pageSlug: "ozel-istek", sectionKey: "feature_3_title", content: "imzalı hikaye" },
  { pageSlug: "ozel-istek", sectionKey: "feature_3_desc", content: "her eser, sürecin hikayesini anlatan ıslak imzalı sertifika ile gelir." },
  { pageSlug: "ozel-istek", sectionKey: "art_image", content: "/images/custom-request-art.jpg" },
  // Footer
  { pageSlug: "footer", sectionKey: "tagline", content: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı." },
  { pageSlug: "footer", sectionKey: "email", content: "info@zeyn.art" },
  { pageSlug: "footer", sectionKey: "phone_label", content: "telefon" },
  { pageSlug: "footer", sectionKey: "email_label", content: "e-posta" },
  { pageSlug: "footer", sectionKey: "instagram_label", content: "instagram" },
];
```

- [ ] **Step 2: Verify by restarting dev server**

Run: `make dev` (or restart the dev server)

The bootstrap runs `seedPageContent()` which uses `onConflictDoNothing()`. For existing DBs, you may need to reset the DB to pick up the fixed slugs: `rm data/sqlite.db && make dev`.

Expected: Server starts without errors, `[seed] Page content seeded` in logs.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/seed.ts
git commit -m "fix: correct seed data slugs and add new pageContent entries for inline editing"
```

---

### Task 2: Enhance ArtworkFormModal — add delete + fix z-index

**Files:**
- Modify: `src/components/artwork/artwork-form-modal.tsx`

**Context:** The modal already exists with full create/edit support. It needs: (1) a delete button for existing artworks, (2) z-index bumped from `z-[150]` to `z-[300]` so it renders above AdminToolbar.

- [ ] **Step 1: Bump z-index from `z-[150]` to `z-[300]`**

In `src/components/artwork/artwork-form-modal.tsx`, find line 83:
```tsx
<div className="fixed inset-0 z-[150] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
```
Change `z-[150]` to `z-[300]`.

- [ ] **Step 2: Add delete handler function**

Add a `deleting` state next to `saving`:
```typescript
const [deleting, setDeleting] = useState(false);
```

Add a `handleDelete` function after `handleSubmit`:
```typescript
async function handleDelete() {
  if (!artwork) return;
  if (!confirm("Bu eseri silmek istediğinize emin misiniz?")) return;
  setDeleting(true);
  try {
    const res = await fetch(`/api/artworks/${artwork.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    showToast("eser silindi", "success");
    onSaved();
  } catch {
    showToast("silinemedi", "error");
  } finally {
    setDeleting(false);
  }
}
```

- [ ] **Step 3: Add delete button in the actions footer**

In the actions `<div>` (after the "iptal" button), add:
```tsx
{isEditing && (
  <button
    type="button"
    onClick={handleDelete}
    disabled={deleting}
    className="ml-auto bg-error text-on-error px-8 py-3 font-bold tracking-tight hover:bg-error/80 transition-all duration-300 disabled:opacity-50"
  >
    {deleting ? "siliniyor..." : "sil"}
  </button>
)}
```

- [ ] **Step 4: Test manually**

1. `make dev`, go to gallery page
2. Toggle edit mode on in admin sidebar
3. Click an existing artwork → modal opens above sidebar (z-300)
4. Verify "sil" button appears for existing artworks
5. Click "sil" → confirm dialog → artwork deleted, gallery refreshes
6. Click "+ Yeni Eser Ekle" → no "sil" button (create mode)

- [ ] **Step 5: Commit**

```bash
git add src/components/artwork/artwork-form-modal.tsx
git commit -m "feat: add delete button to artwork modal, fix z-index layering"
```

---

## Chunk 2: Page-by-Page Inline Editing Coverage

### Task 3: About page — add skill tags, identity label, portrait image editing

**Files:**
- Modify: `src/app/hakkinda/page.tsx`

**Context:** The about page already has `InlineEdit` for `bio_1` and `bio_2`. It needs: skill tags wrapped with `InlineEdit`, identity label wrapped with `InlineEdit`, and portrait image wrapped with `ImageUpload`. The page already has a `getContent()` helper and is `async`.

- [ ] **Step 1: Add new content fetches**

After the existing `bio2` fetch (line 28-31), add:
```typescript
const skill1 = await getContent("skill_1", "dijital sanat");
const skill2 = await getContent("skill_2", "kürasyon");
const skill3 = await getContent("skill_3", "fotoğrafçılık");
const identityLabel = await getContent("identity_label", "kurucu & küratör");
const portraitImage = await getContent("portrait_image", "/uploads/pages/portrait.webp");
```

- [ ] **Step 2: Add ImageUpload import**

Add to imports at top:
```typescript
import { ImageUpload } from "@/components/admin/image-upload";
```

- [ ] **Step 3: Wrap portrait image with ImageUpload**

The page needs to become a client-server hybrid for the image upload. Since `ImageUpload` is a client component and the page is a server component, wrap just the image section. Replace the portrait `<img>` block (lines 44-49):

```tsx
<div className="relative z-10 bg-white p-2 shadow-xl">
  <HakkindaPortrait initialSrc={portraitImage} />
</div>
```

Create a new client component at the bottom of the file or in a separate file. Simplest: create `src/app/hakkinda/hakkinda-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { InlineEdit } from "@/components/admin/inline-edit";

export function HakkindaPortrait({ initialSrc }: { initialSrc: string }) {
  const [src, setSrc] = useState(initialSrc);

  async function handleUpload(newPath: string) {
    setSrc(newPath);
    await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageSlug: "hakkinda", sectionKey: "portrait_image", content: newPath }),
    });
  }

  return (
    <ImageUpload currentSrc={src} category="pages" onUpload={handleUpload}>
      <img
        src={src}
        alt="Zeynep Kömür"
        className="w-full aspect-[4/5] object-cover grayscale"
      />
    </ImageUpload>
  );
}

export function HakkindaSkills({
  skill1,
  skill2,
  skill3,
}: {
  skill1: string;
  skill2: string;
  skill3: string;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-6">
      <div className="flex items-center gap-2 bg-secondary-container px-4 py-2 text-on-secondary-container text-xs font-bold tracking-widest lowercase">
        <span className="material-symbols-outlined text-sm">palette</span>
        <InlineEdit pageSlug="hakkinda" sectionKey="skill_1" initialContent={skill1} as="span" className="text-xs font-bold tracking-widest lowercase" />
      </div>
      <div className="flex items-center gap-2 bg-tertiary-container px-4 py-2 text-on-tertiary-container text-xs font-bold tracking-widest lowercase">
        <span className="material-symbols-outlined text-sm">architecture</span>
        <InlineEdit pageSlug="hakkinda" sectionKey="skill_2" initialContent={skill2} as="span" className="text-xs font-bold tracking-widest lowercase" />
      </div>
      <div className="flex items-center gap-2 bg-primary-container px-4 py-2 text-on-primary-container text-xs font-bold tracking-widest lowercase">
        <span className="material-symbols-outlined text-sm">frame_person</span>
        <InlineEdit pageSlug="hakkinda" sectionKey="skill_3" initialContent={skill3} as="span" className="text-xs font-bold tracking-widest lowercase" />
      </div>
    </div>
  );
}

export function HakkindaIdentityLabel({ initialContent }: { initialContent: string }) {
  return (
    <InlineEdit
      pageSlug="hakkinda"
      sectionKey="identity_label"
      initialContent={initialContent}
      as="span"
      className="font-bold text-sm tracking-widest lowercase"
    />
  );
}
```

- [ ] **Step 4: Update hakkinda/page.tsx to use the new client components**

Import the new components:
```typescript
import { HakkindaPortrait, HakkindaSkills, HakkindaIdentityLabel } from "./hakkinda-client";
```

Replace the skill tags `<div>` (lines 90-103) with:
```tsx
<HakkindaSkills skill1={skill1} skill2={skill2} skill3={skill3} />
```

Replace the identity label section (lines 52-57, the entire `<div className="absolute -bottom-4...">` block) with:
```tsx
<div className="absolute -bottom-4 right-4 bg-tertiary text-on-tertiary px-6 py-3 z-20 shadow-lg">
  <HakkindaIdentityLabel initialContent={identityLabel} />
</div>
```

Replace the portrait section (lines 44-49) with:
```tsx
<div className="relative z-10 bg-white p-2 shadow-xl">
  <HakkindaPortrait initialSrc={portraitImage} />
</div>
```

- [ ] **Step 5: Test manually**

1. Toggle edit mode
2. Hover over portrait → upload overlay appears
3. Click skill tags → inline edit activates
4. Click identity label → inline edit activates
5. Edit + blur → saves successfully (check toast)

- [ ] **Step 6: Commit**

```bash
git add src/app/hakkinda/page.tsx src/app/hakkinda/hakkinda-client.tsx
git commit -m "feat: add inline editing for about page skills, identity label, and portrait"
```

---

### Task 4: Gallery page — add quote section inline editing

**Files:**
- Modify: `src/app/galeri/page.tsx`

**Context:** The gallery page is already `async` and fetches artworks from DB. The quote section has hardcoded text. We need to fetch quote content from `pageContent` and wrap with `InlineEdit`.

- [ ] **Step 1: Add pageContent import and fetch**

Add to imports:
```typescript
import { pageContent } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { InlineEdit } from "@/components/admin/inline-edit";
```

Add a `getContent` helper (same pattern as hakkinda):
```typescript
async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "galeri"),
        eq(pageContent.sectionKey, sectionKey)
      )
    );
  return row?.content ?? fallback;
}
```

Inside `GaleriPage`, before the return:
```typescript
const quoteText = await getContent("quote_text", "sanat, görünmeyeni görünür kılmaktır. her fırça darbesi, bir hikayenin başlangıcıdır.");
const quoteAttribution = await getContent("quote_attribution", "zeynep kömür");
```

- [ ] **Step 2: Wrap quote text with InlineEdit**

Replace the hardcoded quote `<p>` (line 28):
```tsx
<p className="text-3xl font-light italic text-on-surface leading-relaxed px-8">
  &ldquo;sanat, görünmeyeni görünür kılmaktır...&rdquo;
</p>
```
With (keep typographic quotes as decorative wrapper around the editable content):
```tsx
<p className="text-3xl font-light italic text-on-surface leading-relaxed px-8">
  &ldquo;<InlineEdit
    pageSlug="galeri"
    sectionKey="quote_text"
    initialContent={quoteText}
    as="span"
    className="text-3xl font-light italic text-on-surface leading-relaxed"
    multiline
  />&rdquo;
</p>
```

Replace the hardcoded attribution (line 33):
```tsx
<span className="font-bold uppercase tracking-widest text-xs">
  zeynep kömür
</span>
```
With:
```tsx
<InlineEdit
  pageSlug="galeri"
  sectionKey="quote_attribution"
  initialContent={quoteAttribution}
  as="span"
  className="font-bold uppercase tracking-widest text-xs"
/>
```

- [ ] **Step 3: Test manually**

1. Go to `/galeri`, toggle edit mode
2. Click quote text → editable
3. Click attribution → editable
4. Save → toast confirms

- [ ] **Step 4: Commit**

```bash
git add src/app/galeri/page.tsx
git commit -m "feat: add inline editing for gallery quote section"
```

---

### Task 5: Contact page — convert to async + add full InlineEdit coverage

**Files:**
- Modify: `src/app/iletisim/page.tsx`

**Context:** The contact page has ZERO InlineEdit usage. All text is hardcoded. The page is a synchronous function. It needs to become async, fetch content from DB, and wrap all text with InlineEdit.

- [ ] **Step 1: Convert page to async with content fetching**

Replace the entire `src/app/iletisim/page.tsx` with:

```tsx
export const dynamic = "force-dynamic";
import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "@/components/forms/contact-form";
import { QuestionForm } from "@/components/forms/question-form";
import { InlineEdit } from "@/components/admin/inline-edit";

async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "contact"),
        eq(pageContent.sectionKey, sectionKey)
      )
    );
  return row?.content ?? fallback;
}

export default async function IletisimPage() {
  const headline = await getContent("headline", "arada bağ kuralım");
  const section1Title = await getContent("section_1_title", "beraber çalışalım.");
  const section2Title = await getContent("section_2_title", "bana her şeyi sorabilirsin.");
  const studioAddress = await getContent("studio_address", "moda, kadıköy, istanbul, türkiye");
  const studioHours = await getContent("studio_hours", "pazartesi - cumartesi, 10:00 - 19:00");
  const studioEmail = await getContent("studio_email", "merhaba@zeyn.art");
  const studioSocial = await getContent("studio_social", "@zeyn.art");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar currentPage="iletisim" />

      <main className="flex-1 pt-48 pb-24 px-8 md:px-16 max-w-[1440px] mx-auto w-full">
        {/* Hero headline */}
        <div className="mb-24 text-center lg:text-left">
          <h1 className="text-8xl md:text-[10rem] font-extrabold tracking-tighter text-on-surface lowercase leading-none">
            <InlineEdit
              pageSlug="contact"
              sectionKey="headline"
              initialContent={headline}
              as="span"
              className="text-8xl md:text-[10rem] font-extrabold tracking-tighter text-on-surface lowercase leading-none"
            />
          </h1>
        </div>

        {/* Section 1: Beraber çalışalım */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <InlineEdit
                pageSlug="contact"
                sectionKey="section_1_title"
                initialContent={section1Title}
                as="h2"
                className="text-7xl md:text-[9rem] font-extrabold tracking-tighter text-on-surface lowercase leading-[0.85] mb-8"
              />
            </div>
            <div className="lg:col-span-5 lg:pt-8">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Pink divider */}
        <div className="w-32 h-2 bg-tertiary mb-48 opacity-60" />

        {/* Section 2: Bana her şeyi sorabilirsin */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-5 order-2 lg:order-1 lg:pb-8">
              <QuestionForm />
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2 text-right">
              <InlineEdit
                pageSlug="contact"
                sectionKey="section_2_title"
                initialContent={section2Title}
                as="h2"
                className="text-7xl md:text-[9rem] font-extrabold tracking-tighter text-on-surface lowercase leading-[0.85] mb-8"
              />
            </div>
          </div>
        </section>

        {/* Studio info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-24 mb-32">
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              stüdyo
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_address"
              initialContent={studioAddress}
              as="p"
              multiline
              className="text-2xl text-on-surface lowercase leading-tight"
            />
          </div>
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              mesai
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_hours"
              initialContent={studioHours}
              as="p"
              multiline
              className="text-2xl text-on-surface lowercase leading-tight"
            />
          </div>
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              dijital
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_email"
              initialContent={studioEmail}
              as="p"
              className="text-2xl text-on-surface lowercase leading-tight"
            />
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_social"
              initialContent={studioSocial}
              as="p"
              className="text-2xl text-on-surface lowercase leading-tight mt-1"
            />
          </div>
        </div>
      </main>

      <Footer variant="white" />
    </div>
  );
}
```

- [ ] **Step 2: Test manually**

1. Go to `/iletisim`, toggle edit mode
2. Click headline → editable
3. Click section titles → editable
4. Click studio info (address, hours, email, social) → each editable
5. Save → toast confirms

- [ ] **Step 3: Commit**

```bash
git add src/app/iletisim/page.tsx
git commit -m "feat: add full inline editing to contact page"
```

---

### Task 6: Custom Request page — convert to async + add InlineEdit + ImageUpload

**Files:**
- Modify: `src/app/ozel-istek/page.tsx`
- Create: `src/app/ozel-istek/ozel-istek-client.tsx`

**Context:** The custom request page has zero InlineEdit usage. All text and the art image are hardcoded. Needs async conversion + InlineEdit for all text + ImageUpload for the art image.

- [ ] **Step 1: Create client component for the image**

Create `src/app/ozel-istek/ozel-istek-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { FallbackImage } from "@/components/ui/fallback-image";

export function OzelIstekImage({ initialSrc }: { initialSrc: string }) {
  const [src, setSrc] = useState(initialSrc);

  async function handleUpload(newPath: string) {
    setSrc(newPath);
    await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageSlug: "ozel-istek", sectionKey: "art_image", content: newPath }),
    });
  }

  return (
    <ImageUpload currentSrc={src} category="pages" onUpload={handleUpload}>
      <FallbackImage
        alt="modern sanat illüstrasyonu"
        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
        src={src}
        fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e8e6ff'/%3E%3Crect x='50' y='50' width='300' height='300' fill='%23004be3' opacity='0.2'/%3E%3C/svg%3E"
      />
    </ImageUpload>
  );
}
```

- [ ] **Step 2: Rewrite the page with async + InlineEdit**

Replace `src/app/ozel-istek/page.tsx` with:

```tsx
export const dynamic = "force-dynamic";
import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CustomRequestForm } from "@/components/forms/custom-request-form";
import { InlineEdit } from "@/components/admin/inline-edit";
import { OzelIstekImage } from "./ozel-istek-client";

async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "ozel-istek"),
        eq(pageContent.sectionKey, sectionKey)
      )
    );
  return row?.content ?? fallback;
}

export default async function OzelIstekPage() {
  const headline = await getContent("headline", "özelleştirilmiş resim isteği");
  const description = await getContent("description", "mekanınıza ruh katacak, sadece size özel üretilecek bir eser için kürasyon sürecini başlatın.");
  const feature1Title = await getContent("feature_1_title", "renk kürasyonu");
  const feature1Desc = await getContent("feature_1_desc", "mekanınızın ışık ve dokusuna uygun özel pigment seçimi.");
  const feature2Title = await getContent("feature_2_title", "boyut ve oran");
  const feature2Desc = await getContent("feature_2_desc", "duvar ölçülerinize altın oran ile uyumlu özel kanvas üretimi.");
  const feature3Title = await getContent("feature_3_title", "imzalı hikaye");
  const feature3Desc = await getContent("feature_3_desc", "her eser, sürecin hikayesini anlatan ıslak imzalı sertifika ile gelir.");
  const artImage = await getContent("art_image", "/images/custom-request-art.jpg");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="ozel-istek" />

      <main className="flex-1 pt-48 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <header className="mb-20">
          <InlineEdit
            pageSlug="ozel-istek"
            sectionKey="headline"
            initialContent={headline}
            as="h1"
            className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase mb-6 leading-none"
          />
          <InlineEdit
            pageSlug="ozel-istek"
            sectionKey="description"
            initialContent={description}
            as="p"
            multiline
            className="text-on-surface-variant max-w-2xl text-lg lowercase"
          />
        </header>

        {/* Two-column form + info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-surface-container-highest shadow-sm">
          {/* Form side */}
          <section className="lg:col-span-7 bg-white p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-16 -mt-16 rotate-45" style={{ backgroundColor: "#FFD54F" }} />
            <CustomRequestForm />
          </section>

          {/* Visual side */}
          <section className="lg:col-span-5 bg-white flex flex-col">
            <div className="aspect-square w-full relative group overflow-hidden">
              <OzelIstekImage initialSrc={artImage} />
              <div className="absolute inset-0 opacity-10 mix-blend-multiply pointer-events-none" style={{ backgroundColor: "#085F7F" }} />
            </div>

            <div className="p-12 space-y-8 bg-surface-container flex-grow">
              {/* Feature 1: Renk kürasyonu */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: "#085F7F" }}>
                  <span className="material-symbols-outlined text-white text-sm">palette</span>
                </div>
                <div>
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_1_title" initialContent={feature1Title} as="h3" className="font-bold text-on-surface lowercase mb-1 text-sm" />
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_1_desc" initialContent={feature1Desc} as="p" className="text-xs text-on-surface-variant lowercase" />
                </div>
              </div>

              {/* Feature 2: Boyut ve oran */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: "#FFD54F" }}>
                  <span className="material-symbols-outlined text-on-secondary-container text-sm">aspect_ratio</span>
                </div>
                <div>
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_2_title" initialContent={feature2Title} as="h3" className="font-bold text-on-surface lowercase mb-1 text-sm" />
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_2_desc" initialContent={feature2Desc} as="p" className="text-xs text-on-surface-variant lowercase" />
                </div>
              </div>

              {/* Feature 3: İmzalı hikaye */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: "#F4A261" }}>
                  <span className="material-symbols-outlined text-white text-sm">history_edu</span>
                </div>
                <div>
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_3_title" initialContent={feature3Title} as="h3" className="font-bold text-on-surface lowercase mb-1 text-sm" />
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_3_desc" initialContent={feature3Desc} as="p" className="text-xs text-on-surface-variant lowercase" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer variant="white" />
    </div>
  );
}
```

- [ ] **Step 3: Test manually**

1. Go to `/ozel-istek`, toggle edit mode
2. Click headline, description, each feature title/desc → all editable
3. Hover art image → upload overlay appears
4. Save edits → toast confirms

- [ ] **Step 4: Commit**

```bash
git add src/app/ozel-istek/page.tsx src/app/ozel-istek/ozel-istek-client.tsx
git commit -m "feat: add full inline editing to custom request page"
```

---

### Task 7: Footer — accept content props + add InlineEdit

**Files:**
- Modify: `src/components/layout/footer.tsx`
- Modify: `src/app/page.tsx` (home — pass footer content)
- Modify: `src/app/hakkinda/page.tsx` (pass footer content)
- Modify: `src/app/galeri/page.tsx` (pass footer content)
- Modify: `src/app/iletisim/page.tsx` (pass footer content)
- Modify: `src/app/ozel-istek/page.tsx` (pass footer content)

**Context:** The footer has two variants (white/yellow) with all text hardcoded. We add an optional `content` prop so server pages can pass DB content. Inside the footer, wrap editable text with `InlineEdit`. If `content` is undefined, hardcoded defaults are used (backwards compatible).

- [ ] **Step 1: Update Footer component**

Replace `src/components/layout/footer.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { InlineEdit } from "@/components/admin/inline-edit";

type FooterProps = {
  variant: "white" | "yellow";
  content?: Record<string, string>;
};

const DEFAULTS: Record<string, string> = {
  tagline: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı.",
  email: "info@zeyn.art",
  phone_label: "telefon",
  email_label: "e-posta",
  instagram_label: "instagram",
};

function c(content: Record<string, string> | undefined, key: string) {
  return content?.[key] ?? DEFAULTS[key];
}

export function Footer({ variant, content }: FooterProps) {
  if (variant === "yellow") return <YellowFooter content={content} />;
  return <WhiteFooter content={content} />;
}

function WhiteFooter({ content }: { content?: Record<string, string> }) {
  return (
    <footer className="bg-white grid grid-cols-1 md:grid-cols-3 gap-12 px-12 py-24 w-full border-t border-outline/20">
      <div className="flex flex-col space-y-6">
        <div className="text-xl font-bold text-on-surface lowercase">
          by zeynep kömür
        </div>
        <InlineEdit
          pageSlug="footer"
          sectionKey="tagline"
          initialContent={c(content, "tagline")}
          as="p"
          multiline
          className="text-on-surface-variant max-w-xs font-body text-sm leading-relaxed tracking-wide lowercase"
        />
      </div>
      <div className="flex flex-col space-y-4 md:items-center">
        <div className="flex flex-col space-y-3">
          <Link
            href="tel:+900000000000"
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            <InlineEdit
              pageSlug="footer"
              sectionKey="phone_label"
              initialContent={c(content, "phone_label")}
              as="span"
              className="text-on-surface-variant font-body text-sm tracking-[0.1em] lowercase"
            />
          </Link>
          <Link
            href={`mailto:${c(content, "email")}`}
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            <InlineEdit
              pageSlug="footer"
              sectionKey="email_label"
              initialContent={c(content, "email_label")}
              as="span"
              className="text-on-surface-variant font-body text-sm tracking-[0.1em] lowercase"
            />
          </Link>
          <Link
            href="https://instagram.com"
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            <InlineEdit
              pageSlug="footer"
              sectionKey="instagram_label"
              initialContent={c(content, "instagram_label")}
              as="span"
              className="text-on-surface-variant font-body text-sm tracking-[0.1em] lowercase"
            />
          </Link>
        </div>
      </div>
      <div className="flex flex-col space-y-6 md:items-end justify-between">
        <div className="flex space-x-8">
          <span className="material-symbols-outlined text-primary text-3xl">palette</span>
          <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>brush</span>
          <span className="material-symbols-outlined text-highlight-pink text-3xl">gallery_thumbnail</span>
        </div>
        <div className="text-on-surface-variant font-body text-xs tracking-[0.2em] lowercase opacity-60">
          &copy; by zeynep kömür. all rights reserved.
        </div>
      </div>
    </footer>
  );
}

function YellowFooter({ content }: { content?: Record<string, string> }) {
  return (
    <footer className="bg-secondary-container flex flex-col md:flex-row justify-between items-center w-full px-12 py-16 font-body text-sm lowercase">
      <div className="font-bold text-on-secondary-container mb-8 md:mb-0 text-base">
        &copy; by zeynep kömür. sade ama vurucu.
      </div>
      <div className="flex flex-wrap justify-center gap-12 text-on-secondary-container">
        <Link href="tel:+900000000000" className="hover:text-primary transition-all flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-base">call</span>
          <InlineEdit pageSlug="footer" sectionKey="phone_label" initialContent={c(content, "phone_label")} as="span" className="font-medium" />
        </Link>
        <Link href={`mailto:${c(content, "email")}`} className="hover:text-primary transition-all flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-base">mail</span>
          <InlineEdit pageSlug="footer" sectionKey="email_label" initialContent={c(content, "email_label")} as="span" className="font-medium" />
        </Link>
        <Link href="https://instagram.com" className="underline font-bold hover:text-primary transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-base">camera</span>
          <InlineEdit pageSlug="footer" sectionKey="instagram_label" initialContent={c(content, "instagram_label")} as="span" className="font-bold" />
        </Link>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Create a shared helper to fetch footer content**

Create `src/lib/get-footer-content.ts`:

```typescript
import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getFooterContent(): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "footer"));

  const content: Record<string, string> = {};
  for (const row of rows) {
    content[row.sectionKey] = row.content;
  }
  return content;
}
```

- [ ] **Step 3: Update all pages to pass footer content**

In each page file, add import:
```typescript
import { getFooterContent } from "@/lib/get-footer-content";
```

Inside each page's async function, add:
```typescript
const footerContent = await getFooterContent();
```

Then change `<Footer variant="..." />` to `<Footer variant="..." content={footerContent} />`.

Files to update:
- `src/app/page.tsx` — `<Footer variant="white" content={footerContent} />`
- `src/app/hakkinda/page.tsx` — `<Footer variant="white" content={footerContent} />`
- `src/app/galeri/page.tsx` — `<Footer variant="yellow" content={footerContent} />`
- `src/app/iletisim/page.tsx` — `<Footer variant="white" content={footerContent} />`
- `src/app/ozel-istek/page.tsx` — `<Footer variant="white" content={footerContent} />`

- [ ] **Step 4: Test manually**

1. Toggle edit mode
2. On any page, scroll to footer
3. Click tagline → editable
4. Click phone/email/instagram labels → editable
5. Save → toast confirms
6. Check both white and yellow footer variants

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/footer.tsx src/lib/get-footer-content.ts src/app/page.tsx src/app/hakkinda/page.tsx src/app/galeri/page.tsx src/app/iletisim/page.tsx src/app/ozel-istek/page.tsx
git commit -m "feat: add inline editing to footer across all pages"
```

---

## Chunk 3: Collection Manager Modal

### Task 8: Add GET handler for collection artworks API

**Files:**
- Modify: `src/app/api/collections/[id]/artworks/route.ts`

**Context:** The collection artworks API only has a PUT handler. The CollectionManagerModal form needs to GET a collection's artworks to pre-populate the selector. This must be added before the modal.

- [ ] **Step 1: Add GET handler**

In `src/app/api/collections/[id]/artworks/route.ts`, add imports for `asc` and add the GET function:

```typescript
import { asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(collectionArtworks)
    .where(eq(collectionArtworks.collectionId, id))
    .orderBy(asc(collectionArtworks.sortOrder));
  return Response.json(rows);
}
```

- [ ] **Step 2: Test manually**

```bash
curl http://localhost:3000/api/collections/SOME_ID/artworks
```
Expected: JSON array (empty `[]` if no artworks assigned).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/collections/[id]/artworks/route.ts
git commit -m "feat: add GET handler for collection artworks API"
```

---

### Task 9: Build CollectionManagerModal + wire to AdminToolbar

**Files:**
- Create: `src/components/admin/collection-manager-modal.tsx`
- Modify: `src/components/layout/admin-toolbar.tsx`

**Context:** New modal triggered from admin sidebar. This task builds both the list view AND the create/edit form view as a single shippable unit. Uses a `<button>` element in the toolbar (not `NavItem`, which renders a `<Link>`).

- [ ] **Step 1: Create the full modal (list view + form view)**

Create `src/components/admin/collection-manager-modal.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { showToast } from "./toast";

type Collection = {
  id: string;
  title: string;
  slug: string;
  description: string;
  templateType: "grid" | "showcase" | "challenge";
  metadata: string;
  isPublished: boolean;
  artworkCount?: number;
};

type CollectionManagerModalProps = {
  onClose: () => void;
};

export function CollectionManagerModal({ onClose }: CollectionManagerModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch {
      showToast("koleksiyonlar yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu koleksiyonu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("koleksiyon silindi", "success");
      fetchCollections();
    } catch {
      showToast("silinemedi", "error");
    }
  }

  const templateLabels: Record<string, string> = {
    grid: "ızgara",
    showcase: "vitrin",
    challenge: "meydan okuma",
  };

  if (editingCollection || creating) {
    return (
      <CollectionFormView
        collection={editingCollection}
        onClose={onClose}
        onBack={() => {
          setEditingCollection(null);
          setCreating(false);
          fetchCollections();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">koleksiyonlar</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreating(true)}
              className="bg-primary text-on-primary px-4 py-2 text-sm font-bold lowercase tracking-tight hover:bg-primary-dim transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              yeni koleksiyon
            </button>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
            </div>
          ) : collections.length === 0 ? (
            <p className="text-center text-on-surface-variant py-12 lowercase">henüz koleksiyon yok</p>
          ) : (
            <div className="space-y-4">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-4 border border-surface-container-highest hover:bg-surface-container-low transition-colors cursor-pointer"
                  onClick={() => setEditingCollection(col)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-on-surface lowercase">{col.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-highest px-2 py-0.5 text-on-surface-variant">
                        {templateLabels[col.templateType] ?? col.templateType}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${col.isPublished ? "bg-primary/10 text-primary" : "bg-outline/10 text-outline"}`}>
                        {col.isPublished ? "yayında" : "taslak"}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 lowercase">{col.description || "açıklama yok"}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(col.id);
                    }}
                    className="text-on-surface-variant hover:text-error transition-colors ml-4"
                    aria-label="Sil"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Full CollectionFormView implementation — see Step 2 below
```

The file continues with the `CollectionFormView` component below.

- [ ] **Step 2: Add the CollectionFormView to the same file**

Add these imports at the top of the file (merge with existing imports):

```tsx
import { ArtworkSelector } from "@/components/collection/artwork-selector";
import type { Artwork } from "@/components/artwork/artwork-card";
```

Replace the comment placeholder with the full `CollectionFormView`:

```tsx
import { ArtworkSelector } from "@/components/collection/artwork-selector";
import type { Artwork } from "@/components/artwork/artwork-card";
```

Add these imports at the top of the file.

Then replace the `CollectionFormView` function:

```tsx
type CollectionArtworkEntry = {
  artworkId: string;
  sortOrder: number;
  dayNumber: number | null;
};

function CollectionFormView({
  collection,
  onClose,
  onBack,
}: {
  collection: Collection | null;
  onClose: () => void;
  onBack: () => void;
}) {
  const isEdit = !!collection;
  const [title, setTitle] = useState(collection?.title ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [templateType, setTemplateType] = useState<"grid" | "showcase" | "challenge">(collection?.templateType ?? "grid");
  const [isPublished, setIsPublished] = useState(collection?.isPublished ?? false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [artworkEntries, setArtworkEntries] = useState<CollectionArtworkEntry[]>([]);
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingArtworks, setLoadingArtworks] = useState(true);

  useEffect(() => {
    // Fetch all artworks
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data) => {
        setAllArtworks(Array.isArray(data) ? data : []);
        setLoadingArtworks(false);
      });

    // If editing, fetch collection's artworks
    if (collection) {
      fetch(`/api/collections/${collection.id}/artworks`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const ids = data.map((d: any) => d.artworkId);
            setSelectedIds(ids);
            setArtworkEntries(
              data.map((d: any, i: number) => ({
                artworkId: d.artworkId,
                sortOrder: d.sortOrder ?? i,
                dayNumber: d.dayNumber ?? null,
              }))
            );
          }
        });
    }
  }, [collection]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEdit) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9ğüşıöç\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim()
      );
    }
  }, [title, isEdit]);

  function handleSelectionChange(ids: string[]) {
    setSelectedIds(ids);
    // Add new entries, keep existing ones
    const newEntries = ids.map((id, i) => {
      const existing = artworkEntries.find((e) => e.artworkId === id);
      return existing ?? { artworkId: id, sortOrder: i, dayNumber: null };
    });
    setArtworkEntries(newEntries);
  }

  function moveArtwork(index: number, direction: -1 | 1) {
    const newEntries = [...artworkEntries];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newEntries.length) return;
    [newEntries[index], newEntries[targetIndex]] = [newEntries[targetIndex], newEntries[index]];
    newEntries.forEach((e, i) => (e.sortOrder = i));
    setArtworkEntries(newEntries);
    setSelectedIds(newEntries.map((e) => e.artworkId));
  }

  function setDayNumber(artworkId: string, dayNumber: number | null) {
    setArtworkEntries((prev) =>
      prev.map((e) => (e.artworkId === artworkId ? { ...e, dayNumber } : e))
    );
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim()) {
      showToast("başlık ve slug gerekli", "error");
      return;
    }
    setSaving(true);
    try {
      let collectionId = collection?.id;

      const body = {
        title,
        slug,
        description,
        templateType,
        metadata: JSON.stringify({}),
        isPublished,
      };

      if (isEdit) {
        const res = await fetch(`/api/collections/${collectionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        collectionId = data.id;
      }

      // Save artworks
      const artworksBody = artworkEntries.map((e, i) => ({
        artworkId: e.artworkId,
        sortOrder: i,
        dayNumber: e.dayNumber,
      }));

      await fetch(`/api/collections/${collectionId}/artworks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artworksBody),
      });

      showToast(isEdit ? "koleksiyon güncellendi" : "koleksiyon oluşturuldu", "success");
      onBack();
    } catch {
      showToast("kaydedilemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  const templateOptions = [
    { value: "grid" as const, icon: "grid_view", label: "ızgara" },
    { value: "showcase" as const, icon: "auto_awesome", label: "vitrin" },
    { value: "challenge" as const, icon: "emoji_events", label: "meydan okuma" },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h2 className="text-2xl font-bold text-on-surface lowercase">
              {isEdit ? "koleksiyonu düzenle" : "yeni koleksiyon"}
            </h2>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
              placeholder="koleksiyon adı"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">slug (url)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all font-mono text-sm"
              placeholder="koleksiyon-adi"
            />
            <p className="text-[10px] text-on-surface-variant mt-1">/koleksiyon/{slug || "..."}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all resize-none"
              placeholder="koleksiyon açıklaması"
            />
          </div>

          {/* Template Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-3">şablon</label>
            <div className="grid grid-cols-3 gap-3">
              {templateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTemplateType(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 border-2 transition-colors ${
                    templateType === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-surface-container-highest hover:border-outline-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                  <span className="text-xs font-bold lowercase">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary">yayın durumu</label>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold lowercase transition-colors ${
                isPublished ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {isPublished ? "yayında" : "taslak"}
            </button>
          </div>

          {/* Artwork Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-3">eserler</label>
            {loadingArtworks ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
              </div>
            ) : (
              <>
                <ArtworkSelector
                  allArtworks={allArtworks}
                  selectedIds={selectedIds}
                  onChange={handleSelectionChange}
                />

                {/* Reorder + dayNumber UI for selected artworks */}
                {artworkEntries.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">sıralama</p>
                    {artworkEntries.map((entry, index) => {
                      const artwork = allArtworks.find((a) => a.id === entry.artworkId);
                      if (!artwork) return null;
                      return (
                        <div key={entry.artworkId} className="flex items-center gap-3 p-2 bg-surface-container-low">
                          <img src={artwork.imagePath} alt={artwork.title} className="w-10 h-10 object-cover" />
                          <span className="flex-1 text-sm text-on-surface lowercase truncate">{artwork.title}</span>
                          {templateType === "challenge" && (
                            <input
                              type="number"
                              value={entry.dayNumber ?? ""}
                              onChange={(e) => setDayNumber(entry.artworkId, e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="gün"
                              className="w-16 text-center text-sm border border-outline-variant px-2 py-1"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => moveArtwork(index, -1)}
                            disabled={index === 0}
                            className="text-on-surface-variant hover:text-primary disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-base">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveArtwork(index, 1)}
                            disabled={index === artworkEntries.length - 1}
                            className="text-on-surface-variant hover:text-primary disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-base">arrow_downward</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50"
            >
              {saving ? "kaydediliyor..." : "kaydet"}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="border border-outline-variant text-on-surface px-8 py-3 font-bold tracking-tight hover:bg-surface-container transition-all duration-300"
            >
              geri
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Important:** The `CollectionFormView` uses `useState` and `useEffect` from React — make sure these are in the imports at the top of the file (they should already be there from the list view).

- [ ] **Step 3: Wire "Koleksiyonlar" button to AdminToolbar**

In `src/components/layout/admin-toolbar.tsx`:

Add import at top:
```typescript
import { CollectionManagerModal } from "@/components/admin/collection-manager-modal";
```

Add state:
```typescript
const [showCollections, setShowCollections] = useState(false);
```

In the `<nav>` section (after the existing `NavItem` for gönderiler, around line 123), add a **plain button** (NOT `NavItem`, which renders a `<Link>` and would cause navigation):
```tsx
<button
  onClick={() => {
    setOpen(false);
    setShowCollections(true);
  }}
  className="flex items-center gap-3 px-3 py-2.5 text-sm lowercase tracking-tight text-inverse-on-surface/80 hover:bg-white/10 hover:text-white transition-colors w-full"
>
  <span className="material-symbols-outlined text-lg">collections_bookmark</span>
  <span className="flex-1 text-left">koleksiyonlar</span>
</button>
```

After the closing `</>` of the AdminToolbar return, before the fragment closes, add:
```tsx
{showCollections && (
  <CollectionManagerModal onClose={() => setShowCollections(false)} />
)}
```

- [ ] **Step 4: Test manually**

1. Admin sidebar → click "koleksiyonlar" → modal opens with list view
2. Shows existing collections (or empty state)
3. Delete button works with confirmation
4. Click "yeni koleksiyon" → form view with empty fields
5. Fill in title → slug auto-generates
6. Select template type → visual feedback
7. Toggle published
8. Select artworks → appear in reorder list
9. Reorder with up/down buttons
10. Switch to challenge template → dayNumber inputs appear
11. Save → returns to list with new collection
12. Click existing collection → form pre-filled
13. Edit and save → updates

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/collection-manager-modal.tsx src/components/layout/admin-toolbar.tsx
git commit -m "feat: add collection manager modal with full CRUD to admin sidebar"
```

---

### Task 10: Remove deprecated TemplatePicker + CollectionAdminControls + update collection page footer

**Files:**
- Delete: `src/components/collection/template-picker.tsx`
- Modify: `src/app/koleksiyon/[slug]/collection-page-client.tsx`
- Modify: `src/app/koleksiyon/[slug]/page.tsx`

**Context:** The old `TemplatePicker` and `CollectionAdminControls` had a bug (sending artworkIds to wrong endpoint) and are now fully replaced by `CollectionManagerModal`. Remove them.

- [ ] **Step 1: Remove CollectionAdminControls from collection page**

In `src/app/koleksiyon/[slug]/page.tsx`, remove the import:
```typescript
import { CollectionAdminControls } from "./collection-page-client";
```

And remove the `<CollectionAdminControls ... />` JSX from the return. Also remove the `allArtworks` fetch if it was only used for that component.

- [ ] **Step 2: Delete or simplify collection-page-client.tsx**

If `CollectionAdminControls` was the only export, delete the file. If there are other exports, just remove the `CollectionAdminControls` function and the `TemplatePicker` import.

- [ ] **Step 3: Delete template-picker.tsx**

Delete `src/components/collection/template-picker.tsx`.

- [ ] **Step 4: Update collection page to pass footer content**

In `src/app/koleksiyon/[slug]/page.tsx`, add the footer content fetch (same pattern as other pages):
```typescript
import { getFooterContent } from "@/lib/get-footer-content";
```
Inside the page function:
```typescript
const footerContent = await getFooterContent();
```
Update `<Footer variant="..." />` to `<Footer variant="..." content={footerContent} />`.

- [ ] **Step 5: Test manually**

1. Visit a collection page (`/koleksiyon/[slug]`)
2. Verify no floating "Koleksiyonu Düzenle" button
3. Collection content still renders normally
4. Footer is editable in edit mode
5. Admin can manage collections via sidebar → CollectionManagerModal

- [ ] **Step 6: Commit**

```bash
git add src/components/collection/template-picker.tsx src/app/koleksiyon/[slug]/collection-page-client.tsx src/app/koleksiyon/[slug]/page.tsx
git commit -m "refactor: remove deprecated TemplatePicker and CollectionAdminControls, add footer editing to collection page"
```

---

## Chunk 4: Final Verification

### Task 11: End-to-end verification of all inline editing

**Files:** None (testing only)

- [ ] **Step 1: Reset database and verify seed**

```bash
rm data/sqlite.db && make dev
```

Check logs for `[seed] Page content seeded`.

- [ ] **Step 2: Test each page in edit mode**

Login as admin, toggle edit mode on.

| Page | What to test |
|------|-------------|
| `/` (home) | Hero title, subtitle, new arrivals title/desc, quote text/attribution — all editable. Footer tagline/labels editable. |
| `/hakkinda` | Bio paragraphs, skill tags, identity label editable. Portrait image uploadable. Footer editable. |
| `/galeri` | Quote text/attribution editable. Click artwork → edit modal with delete button. "+ Yeni Eser Ekle" → create modal. Footer editable. |
| `/iletisim` | Headline, section titles, studio info (address, hours, email, social) all editable. Footer editable. |
| `/ozel-istek` | Headline, description, all 3 feature titles/descriptions editable. Art image uploadable. Footer editable. |
| `/koleksiyon/[slug]` | Content renders from DB. Managed via sidebar CollectionManagerModal. |

- [ ] **Step 3: Test collection CRUD**

1. Admin sidebar → Koleksiyonlar → Create new collection
2. Fill fields, select artworks, set template
3. Save → appears in list
4. Click to edit → modify fields → save
5. Delete → confirm → removed
6. Published collection accessible at `/koleksiyon/[slug]`

- [ ] **Step 4: Test artwork CRUD**

1. Gallery → "+ Yeni Eser Ekle" → fill form + upload image → save
2. Click existing artwork → edit form → modify → save
3. Click existing artwork → delete → confirm → removed from gallery

- [ ] **Step 5: Commit any final fixes (if needed)**

Stage only the specific files that were fixed, then commit:
```bash
git commit -m "fix: final adjustments from end-to-end verification"
```
