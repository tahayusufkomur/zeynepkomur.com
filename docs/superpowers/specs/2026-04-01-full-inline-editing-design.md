# Full Inline Editing System — Design Spec

**Goal:** Enable the admin (artist Zeynep) to edit every piece of content on the site — text, images, artworks, and collections — directly from the pages themselves, with no separate admin dashboard needed.

**Approach:** Extend the existing inline editing system (`InlineEdit`, `ImageUpload`, `useAdmin` hook, edit mode toggle) with one new modal (CollectionManagerModal), enhancements to the existing ArtworkFormModal, and full InlineEdit/ImageUpload coverage across all pages.

**Existing infrastructure (no changes needed):**
- `InlineEdit` component — click-to-edit text, saves via PUT `/api/content`
- `ImageUpload` component — hover overlay for image replacement, uploads via POST `/api/uploads`
- `useAdmin()` hook — gates editing behind `isEditing` state
- `EditModeProvider` — toggle with localStorage persistence
- All CRUD API routes for artworks, collections, content, uploads

---

## 1. Artwork CRUD Modal (`ArtworkFormModal`) — ENHANCE EXISTING

The component already exists at `src/components/artwork/artwork-form-modal.tsx` with working create/edit logic, image upload, and all form fields. It uses a **mount/unmount pattern** (no `open` prop — parent renders it conditionally).

### What exists today
- Single-column layout, `z-[150]`, `max-w-2xl`
- All form fields: title, description, category, dimensions, technique, year, availability
- Image upload zone with preview
- Create (POST) and Edit (PUT) flows working
- Toast notifications

### Changes needed
1. **Add delete button** for existing artworks — "Sil" button with `confirm()` dialog, calls `DELETE /api/artworks/[id]`, then `onSaved()`
2. **Bump z-index to `z-[300]`** so modal appears above AdminToolbar (`z-[200]`)

### Trigger (no changes to these)
- **New artwork:** "+ Yeni Eser Ekle" floating button on gallery page (already wired via `onAddNew`)
- **Edit artwork:** Click artwork card in edit mode (already wired via `onEdit`)

### Props (existing, no changes)
```typescript
type ArtworkFormModalProps = {
  artwork?: Artwork | null;  // null/undefined = create, defined = edit
  onClose: () => void;
  onSaved: () => void;
};
```

### Data Flow (existing, no changes except delete)

**Delete (NEW):**
1. Admin clicks "Sil" in the modal footer
2. `confirm("Bu eseri silmek istediğinize emin misiniz?")` dialog
3. DELETE `/api/artworks/[id]` (API handles file cleanup)
4. Call `onSaved()`, which refreshes gallery and closes modal

---

## 2. Collection Manager Modal (`CollectionManagerModal`) — NEW

### Trigger
New "Koleksiyonlar" nav item in the admin sidebar (`AdminToolbar`). Click opens the modal. Uses **mount/unmount pattern** (consistent with ArtworkFormModal).

### Layout
Full-screen modal (`z-[300]`) with two views:

#### List View
- Header: "Koleksiyonlar" title + "Yeni Koleksiyon" button
- Cards for each collection showing:
  - Title
  - Template type badge (grid / showcase / challenge)
  - Artwork count
  - Published / Draft status indicator
- Click card → switches to Edit View
- Delete button per card with confirmation

#### Create/Edit View
- **Title** — text input, required
- **Slug** — auto-generated from title (slugify), editable
- **Açıklama** (description) — textarea
- **Şablon** (template type) — visual picker with 3 options:
  - Grid — icon + "Izgara" label
  - Showcase — icon + "Vitrin" label
  - Challenge — icon + "Meydan Okuma" label
- **Yayın durumu** (published) — toggle switch
- **Eserler** (artworks) — builds on `ArtworkSelector` but needs extensions:
  - Search/filter artworks (exists in ArtworkSelector)
  - Checkbox selection (exists in ArtworkSelector)
  - **Reorder via up/down buttons (NEW — ArtworkSelector currently only returns `string[]` of IDs with no ordering UI)**
  - **For challenge template: day number input per artwork (NEW — ArtworkSelector has no dayNumber support)**
- **Footer:** "Kaydet" + "Geri" (back to list)

**Implementation note:** The existing `ArtworkSelector` component only supports checkbox selection with `onChange(ids: string[])`. The CollectionManagerModal will wrap it with additional reorder UI and dayNumber inputs, or extend the component to support these features. The existing `TemplatePicker` component has a bug (sends `artworkIds` to the collection PUT endpoint instead of the separate artworks endpoint) — the CollectionManagerModal should implement the correct two-call pattern.

**Deprecation:** Once `CollectionManagerModal` is shipped, the existing `TemplatePicker` (`src/components/collection/template-picker.tsx`) and `CollectionAdminControls` (`src/app/koleksiyon/[slug]/collection-page-client.tsx`) should be removed. They contain the buggy two-call pattern and are fully replaced by the new modal.

### Data Flow

**Create:**
1. POST `/api/collections` with title, slug, description, templateType, metadata, isPublished
2. PUT `/api/collections/[id]/artworks` with array of `{artworkId, sortOrder, dayNumber}`
3. Return to list view

**Edit:**
1. GET existing collection data (from list already fetched)
2. PUT `/api/collections/[id]` with updated fields
3. PUT `/api/collections/[id]/artworks` with updated artwork assignments
4. Return to list view

**Delete:**
1. Confirm dialog
2. DELETE `/api/collections/[id]`
3. Refresh list

### Component Location
`src/components/admin/collection-manager-modal.tsx`

---

## 3. Inline Editing Coverage — Page-by-Page Audit

All editable content must be wrapped with `InlineEdit` (text) or `ImageUpload` (images) when edit mode is on.

### Home Page (`/`)
- **Text (already covered):** hero_title, hero_subtitle, new_arrivals_title, new_arrivals_description, quote_text, quote_attribution — all use `InlineEdit` with pageSlug `"home"`
- **Images:** Featured artworks come from DB — no action needed.

### About Page (`/hakkinda`)
- **Text (already covered):** `bio_1`, `bio_2` — use `InlineEdit` with pageSlug `"hakkinda"`
- **Text (needs adding):** Skill tags ("dijital sanat", "kürasyon", "fotoğrafçılık") — currently hardcoded in the template. Add as pageContent entries with pageSlug `"hakkinda"`: `skill_1`, `skill_2`, `skill_3`. Wrap each with `InlineEdit`.
- **Text (needs adding):** Identity label "kurucu & küratör" — hardcoded. Add as `hakkinda/identity_label` and wrap with `InlineEdit`.
- **Image (needs adding):** Artist portrait (`/uploads/pages/portrait.webp`) — wrap the `<img>` with `ImageUpload` component, store path in pageContent as `hakkinda/portrait_image`.
- **Note:** The page currently fetches content with keys `bio_1` and `bio_2`. The seed data uses `bio_main` and `bio_secondary`. The page keys (`bio_1`, `bio_2`) are the correct ones (they're what the code actually queries). The seed data should be updated to match: `bio_main` → `bio_1`, `bio_secondary` → `bio_2`.

### Gallery Page (`/galeri`)
- **Artworks:** Managed via ArtworkFormModal (Section 1). No inline edit needed on cards.
- **Text (needs adding):** Quote text and attribution are hardcoded strings. Add pageContent entries with pageSlug `"galeri"`: `quote_text` ("sanat, görünmeyeni görünür kılmaktır...") and `quote_attribution` ("zeynep kömür"). The page must be converted to fetch these via `getContent()` and wrap with `InlineEdit`.

### Collection Pages (`/koleksiyon/[slug]`)
- **Text:** Collection title, description — editable via CollectionManagerModal
- **Artworks:** Managed via CollectionManagerModal
- **No additional inline editing needed** — content comes from collection DB records

### Contact Page (`/iletisim`) — MAJOR WORK NEEDED
- **Current state:** ALL text is hardcoded. Zero InlineEdit usage. The page does not fetch from `pageContent` at all despite seed entries existing for `contact/*` keys.
- **Text (needs adding — all of these):**
  - `contact/headline` — "arada bağ kuralım" (the h1)
  - `contact/section_1_title` — "beraber çalışalım."
  - `contact/section_2_title` — "bana her şeyi sorabilirsin."
  - `contact/studio_address` — "moda, kadıköy\nistanbul, türkiye"
  - `contact/studio_hours` — "pazartesi - cumartesi\n10:00 - 19:00"
  - `contact/studio_email` — "merhaba@zeyn.art"
  - `contact/studio_social` — "@zeyn.art"
- **Changes required:** Convert the page to an `async` function, add `getContent()` helper (like hakkinda), wrap all text with `InlineEdit`.

### Custom Request Page (`/özel-istek`) — NEEDS INLINE EDIT COVERAGE
- **Current state:** All text is hardcoded. No InlineEdit usage. No pageContent fetching.
- **Text (needs adding):**
  - `ozel-istek/headline` — "özelleştirilmiş resim isteği"
  - `ozel-istek/description` — "mekanınıza ruh katacak..."
  - `ozel-istek/feature_1_title` — "renk kürasyonu"
  - `ozel-istek/feature_1_desc` — "mekanınızın ışık ve dokusuna uygun özel pigment seçimi."
  - `ozel-istek/feature_2_title` — "boyut ve oran"
  - `ozel-istek/feature_2_desc` — "duvar ölçülerinize altın oran ile uyumlu özel kanvas üretimi."
  - `ozel-istek/feature_3_title` — "imzalı hikaye"
  - `ozel-istek/feature_3_desc` — "her eser, sürecin hikayesini anlatan ıslak imzalı sertifika ile gelir."
- **Image (needs adding):** The art image (`/images/custom-request-art.jpg`) — wrap with `ImageUpload`, store path in pageContent as `ozel-istek/art_image`.
- **Changes required:** Convert to `async` function, add `getContent()` helper, wrap all text with `InlineEdit`, wrap image with `ImageUpload`.

### Footer — NEEDS INLINE EDIT COVERAGE
- **Current state:** ALL text is hardcoded in both `WhiteFooter` and `YellowFooter`. No InlineEdit usage.
- **Text (needs adding):**
  - `footer/tagline` — "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı."
  - `footer/email` — "info@zeyn.art"
  - `footer/phone_label` — "telefon"
  - `footer/email_label` — "e-posta"
  - `footer/instagram_label` — "instagram"
- **Changes required:** Footer is a client component (no `async`). Simplest approach: pass a `content` prop from each page's server component. Both `WhiteFooter` and `YellowFooter` receive the same content record. New prop interface:
  ```typescript
  type FooterProps = {
    variant: "white" | "yellow";
    content?: Record<string, string>; // keys: tagline, email, phone_label, email_label, instagram_label
  };
  ```
  Each page fetches footer content entries server-side and passes them down. Inside the footer, wrap editable strings with `InlineEdit`. If `content` is not provided, fall back to hardcoded defaults (backwards compatible).

### Navbar
- **No changes.** Brand name "by zeynep kömür" and nav links are constants.

---

## 4. New pageContent Seed Entries

Update existing seed and add new entries. All content values match the current hardcoded strings in page components.

**Fix existing entries (slug AND key mismatch):**

The seed file currently uses `pageSlug: "about"` but the hakkinda page queries `pageSlug: "hakkinda"`. Both the slug and key names must change:

| current pageSlug | new pageSlug | old sectionKey | new sectionKey |
|-----------------|-------------|---------------|---------------|
| about | hakkinda | bio_main | bio_1 |
| about | hakkinda | bio_secondary | bio_2 |

**New entries:**

| pageSlug | sectionKey | content |
|----------|-----------|---------|
| hakkinda | skill_1 | dijital sanat |
| hakkinda | skill_2 | kürasyon |
| hakkinda | skill_3 | fotoğrafçılık |
| hakkinda | identity_label | kurucu & küratör |
| hakkinda | portrait_image | /uploads/pages/portrait.webp |
| galeri | quote_text | sanat, görünmeyeni görünür kılmaktır. her fırça darbesi, bir hikayenin başlangıcıdır. |
| galeri | quote_attribution | zeynep kömür |
| contact | section_1_title | beraber çalışalım. |
| contact | section_2_title | bana her şeyi sorabilirsin. |
| ozel-istek | feature_1_title | renk kürasyonu |
| ozel-istek | feature_1_desc | mekanınızın ışık ve dokusuna uygun özel pigment seçimi. |
| ozel-istek | feature_2_title | boyut ve oran |
| ozel-istek | feature_2_desc | duvar ölçülerinize altın oran ile uyumlu özel kanvas üretimi. |
| ozel-istek | feature_3_title | imzalı hikaye |
| ozel-istek | feature_3_desc | her eser, sürecin hikayesini anlatan ıslak imzalı sertifika ile gelir. |
| ozel-istek | art_image | /images/custom-request-art.jpg |
| footer | email | info@zeyn.art |
| footer | phone_label | telefon |
| footer | email_label | e-posta |
| footer | instagram_label | instagram |

**Existing seed entries that are correct (no changes):**
- `home/*` (hero_title, hero_subtitle, new_arrivals_title, new_arrivals_description, quote_text, quote_attribution)
- `contact/headline`, `contact/studio_address`, `contact/studio_hours`, `contact/studio_email`, `contact/studio_social`
- `ozel-istek/headline`, `ozel-istek/description`
- `footer/tagline`

---

## 5. Component Dependency Map

```
AdminToolbar
├── Edit Mode Toggle (exists)
├── Koleksiyonlar NavItem (NEW)
│   └── CollectionManagerModal (NEW)
│       ├── List View
│       ├── Create/Edit View
│       │   └── ArtworkSelector (exists, EXTEND with reorder + dayNumber)
│       └── Template type visual picker (NEW, replaces buggy TemplatePicker)
└── Existing nav items

Gallery Page
├── ArtworkGrid (exists, already wired)
│   ├── ArtworkCard (exists) → onClick opens ArtworkFormModal
│   └── "+ Yeni Eser Ekle" button → onClick opens ArtworkFormModal
└── ArtworkFormModal (EXISTS, enhance: add delete button, bump z-index)

All Pages (wrap remaining content)
├── InlineEdit (exists, no changes to component itself)
├── ImageUpload (exists, no changes to component itself)
└── Pages that need conversion to fetch pageContent + wrap elements:
    ├── /iletisim (major: currently zero InlineEdit usage)
    ├── /ozel-istek (major: currently zero InlineEdit usage)
    ├── /galeri (minor: quote section only)
    ├── /hakkinda (minor: skill tags + portrait image)
    └── Footer component (needs content passed as props)
```

---

## 6. Non-Goals

- No drag-and-drop reordering UI for gallery (up/down buttons in collection modal suffice)
- No media library / image browser (images uploaded per-context)
- No bulk operations on artworks
- No form field customization (contact/question forms stay hardcoded)
- No analytics or view counts
- No new API endpoints (all existing endpoints cover the needs)
