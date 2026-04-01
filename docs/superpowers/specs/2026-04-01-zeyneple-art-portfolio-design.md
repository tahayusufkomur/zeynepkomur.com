# zeyneple.art — Artist Portfolio Website Design Spec

## Overview

Personal portfolio website for artist Zeynep Komur, branded as "arada by zeynep komur". The site showcases artworks, provides contact/commission forms, and allows the artist to manage all content via inline editing directly on the live pages.

Design philosophy: Modern Brutalism mixed with Editorial Sophistication — "Sade ama Vurucu" (Simple yet Striking). 0px border-radius everywhere, vibrant color blocking, lowercase branding.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** SQLite via Drizzle ORM
- **Styling:** Tailwind CSS (config extracted from Stitch designs)
- **Auth:** NextAuth (credentials provider, single admin account)
- **Email:** Resend (form notifications)
- **Image storage:** Filesystem (`/uploads/`)
- **Deployment:** Docker Compose (Caddy reverse proxy + Next.js app), localhost for now
- **Language:** TypeScript

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Homepage | Hero section, "yeni gelenler" artwork grid, quote section, color divider |
| `/galeri` | Gallery | Category blocks (resim/dekorasyon/posterler), filter bar, artwork grid, CTA card, artist quote |
| `/hakkinda` | About | Portrait, bio, skill tags |
| `/iletisim` | Contact | Two form sections ("beraber calisalim" + "bana her seyi sorabilirsin"), studio info |
| `/ozel-istek` | Custom Painting Request | Commission form with image upload, feature cards |
| `/koleksiyon/[slug]` | Collection Pages | Template-based campaign pages (3 templates) |
| `/admin/login` | Admin Login | Email + password login |
| `/admin/submissions` | Form Submissions | View/filter submissions, mark as read |

## Data Model

### artworks

| Field | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| title | text | e.g. "mavi derinlik" |
| description | text | e.g. "yagli boya tablosu" |
| category | text (enum) | resim, dekorasyon, posterler |
| dimensions | text | e.g. "50x70 cm" |
| technique | text | e.g. "akrilik" |
| collection | text | nullable |
| year | integer | e.g. 2024 |
| availability | text (enum) | available, sold, contact |
| imagePath | text | relative path to uploaded file |
| sortOrder | integer | for manual ordering |
| createdAt | text (datetime) | |
| updatedAt | text (datetime) | |

### page_content

| Field | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| pageSlug | text | e.g. "home", "about", "contact" |
| sectionKey | text | e.g. "hero_title", "quote_text" |
| content | text | the editable text |
| updatedAt | text (datetime) | |

### collections

| Field | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| title | text | |
| slug | text | unique, URL slug |
| description | text | |
| templateType | text (enum) | grid, showcase, challenge |
| metadata | text (json) | template-specific config |
| isPublished | integer (boolean) | |
| createdAt | text (datetime) | |
| updatedAt | text (datetime) | |

### collection_artworks

| Field | Type | Notes |
|---|---|---|
| collectionId | text (uuid) | FK → collections, composite PK |
| artworkId | text (uuid) | FK → artworks, composite PK |
| sortOrder | integer | |
| dayNumber | integer | nullable, used by "challenge" template for item numbering |

### form_submissions

| Field | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| formType | text (enum) | contact, custom_request, question |
| data | text (json) | all form fields |
| isRead | integer (boolean) | |
| createdAt | text (datetime) | |

### newsletter_subscribers

| Field | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| email | text | unique |
| name | text | nullable |
| subscribedAt | text (datetime) | |

### admin_users

| Field | Type | Notes |
|---|---|---|
| id | text (uuid) | PK |
| email | text | |
| passwordHash | text | bcrypt |

## Inline Editing System

When the admin is logged in, every public page gains edit capabilities:

- **Text content** — click to edit. Turns into input/textarea with subtle outline. Save on blur/Enter via API call. Pencil icon on hover.
- **Images** — hover shows upload overlay button. Click opens file picker. Upload replaces image via API.
- **Artwork cards (gallery)** — "+ Yeni Eser Ekle" floating button. Each card gets delete "x" and drag handles. Click card opens metadata edit modal.
- **Collection pages** — "+ Yeni Koleksiyon" button. Template picker (3 options). Inline editing of title/description. Artwork selector modal.
- **Admin toolbar** — thin fixed bar at top. Shows: current page, unread submissions count (links to `/admin/submissions`), newsletter subscriber count, logout button.

## Collection Templates

Three pre-designed layouts for collection pages:

1. **Grid** — standard responsive artwork grid, scoped to selected artworks
   - `metadata`: `{}` (no extra config needed)
2. **Showcase** — hero image with featured artworks in asymmetric bento layout (like homepage "yeni gelenler")
   - `metadata`: `{ "heroArtworkId": "<uuid>" }` — which artwork to feature large
3. **Challenge** — numbered items with badge/day number, format info, technique label, buy/sold status (like the 30-day mini collection design)
   - `metadata`: `{ "challengeTitle": "meydan okuma", "challengeDescription": "...", "format": "15x15cm", "technique": "akrilik" }`
   - Per-artwork day numbering stored in `collection_artworks.dayNumber`

## Forms

Three form types, all stored in `form_submissions` + email notification via Resend:

1. **Contact ("beraber calisalim")** — name (required, max 100), email (required, validated), project description (required, max 2000)
2. **Question ("bana her seyi sorabilirsin")** — question text (required, max 2000), email (required, validated)
3. **Custom Painting Request** — first name (required, max 50), last name (required, max 50), email (required, validated), space photo upload (optional, max 10MB, JPEG/PNG/WebP), description (required, max 2000)

Validation: server-side validation on all fields. Email validated with proper regex. Error messages displayed inline using `error: #b41340` color. All public POST endpoints rate-limited to 5 requests per minute per IP. Honeypot hidden field on all forms for basic bot protection.

## Newsletter

- "KULUBE KATIL" button in navbar triggers modal
- Collects email + optional name
- Duplicate email shows friendly "zaten kayitlisiniz" message
- Subscriber count visible in admin toolbar

## Pricing Display

All artworks show "fiyat icin iletisime gecin" (contact for price). No prices displayed on the public site.

## Design Fidelity

This is critical. The Stitch design HTML files are the source of truth (they supersede DESIGN.md where they differ):

- Each page component built by directly translating the Stitch HTML into React/JSX
- Exact Tailwind config from the design HTML files (colors, fonts, border-radius: 0px)
- Preserve all hover effects, transitions, responsive breakpoints
- Core color palette: primary `#004be3`, secondary-container `#ffd709`, tertiary `#b30065`, highlight-pink `#F28482`, background `#f8f5ff`
- Additional colors (used on ozel-istek page): petrol-blue `#085F7F`, petrol-dim `#064b65`, warm-yellow `#FFD54F`, warm-orange `#F4A261`
- Fonts: Arimo for `headline`/`display` tokens, Plus Jakarta Sans for `body`/`label` tokens (matches the HTML tailwind configs)
- No 1px borders — separation via color blocking and whitespace
- All branding and nav lowercase
- Material Symbols Outlined for icons
- Navbar: sticky, `bg-white/80 backdrop-blur-md` as the canonical style (homepage variant). Brand text in `text-on-surface`.

Reference designs in `stitch_designs/`:
- `arada_yenilenmi_anasayfa_yeni_renkler/` — Homepage
- `arada_fiyat_bilgisi_kald_r_lm_galeri/` — Gallery (no prices)
- `arada_yenilenmi_galeri_yeni_renkler/` — Gallery (with prices, for reference)
- `arada_yenilenmi_hakk_nda_yeni_renkler/` — About
- `arada_i_leti_im_sar_kelime_vurgulu/` — Contact
- `arada_unified_branding_palette_zel_i_stek/` — Custom Painting Request
- `arada_30_g_n_mini_koleksiyonu/` — 30-Day Collection (challenge template reference)
- `arada_muse/DESIGN.md` — Design system tokens and rules

## Shared Components

- `<Navbar />` — sticky, glassmorphic, lowercase branding, page links, "kulube katil" button
- `<Footer />` — two variants: white bg and yellow secondary-container bg
- `<ArtworkCard />` — image with hover scale, title, description, "fiyat icin iletisime gecin". Admin mode: edit/delete
- `<ArtworkGrid />` — responsive grid (1/2/3/4 cols) with integrated CTA card
- `<CategoryBar />` — three color blocks for filtering (resim/dekorasyon/posterler)
- `<FilterBar />` — dropdowns for renk, boyut, koleksiyon
- `<NewsletterModal />` — email + name collection
- `<InlineEdit />` — wrapper making text content editable when admin logged in
- `<ImageUpload />` — overlay for replacing images
- `<AdminToolbar />` — fixed top bar for logged-in admin
- `<ArtworkFormModal />` — modal for adding/editing artwork metadata

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/artworks` | GET, POST | List / create artworks |
| `/api/artworks/[id]` | PUT, DELETE | Update / delete artwork |
| `/api/artworks/reorder` | PUT | Update sortOrder for multiple artworks |
| `/api/uploads` | POST | Image upload (multipart) |
| `/api/content` | GET, PUT | Read / update page_content |
| `/api/collections` | GET, POST | List / create collections |
| `/api/collections/[id]` | PUT, DELETE | Update / delete collection |
| `/api/collections/[id]/artworks` | PUT | Set artworks for a collection |
| `/api/submissions` | GET, POST | List (admin) / create (public) submissions |
| `/api/submissions/[id]/read` | PUT | Mark submission as read |
| `/api/newsletter` | POST | Subscribe to newsletter |
| `/api/newsletter/count` | GET | Subscriber count (admin) |

## Deployment

### Docker Compose

Two services:
- **caddy** — reverse proxy, `localhost:80` → `app:3000`. Future: swap to domain for auto-HTTPS.
- **app** — Node.js container running Next.js in production mode

### Volumes

- `./data:/app/data` — SQLite DB + backups
- `./uploads:/app/public/uploads` — artwork images

### Environment Variables

- `NEXTAUTH_SECRET` — session encryption
- `NEXTAUTH_URL` — base URL
- `RESEND_API_KEY` — for email sending
- `ADMIN_EMAIL` — initial admin email
- `ADMIN_PASSWORD` — initial admin password (hashed on first run)
- `NOTIFICATION_EMAIL` — where form submissions are sent
- `EMAIL_FROM` — sender address for Resend (e.g. `noreply@zeyneple.art`)

### Backup

- Daily cron inside app container: copies SQLite DB to `data/backups/` with timestamp
- Keep last 30 days

## Image Upload Constraints

- Accepted types: JPEG, PNG, WebP
- Max file size: 10MB
- Filename strategy: UUID-based (e.g. `a1b2c3d4.webp`) to avoid collisions and path issues
- On upload: resize to max 2000px on longest edge, convert to WebP for optimization, keep original as backup
- Storage path: `/uploads/artworks/` for gallery images, `/uploads/forms/` for custom request photos, `/uploads/pages/` for page content images

## Email Notifications

- From address: configured via `EMAIL_FROM` env var (e.g. `noreply@zeyneple.art`)
- Subject format:
  - Contact: `[arada] Yeni iletisim: {name}`
  - Question: `[arada] Yeni soru`
  - Custom request: `[arada] Ozel resim istegi: {firstName} {lastName}`
- Email body: plain text with form data summary
- Failure behavior: log error, still save submission to DB, do not show error to user

## Admin Bootstrap

On app startup:
1. Run Drizzle migrations to ensure schema is up to date
2. If `admin_users` table is empty AND both `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars are set → create admin user with bcrypt-hashed password
3. If table already has a user → do nothing
4. If env vars are missing → log warning and skip

## Admin Submissions Page

`/admin/submissions` — the only dedicated admin page (no Stitch design, follows functional admin aesthetic):

- Tab filters: Tumu / Iletisim / Ozel Istek / Soru
- List view: each row shows date, form type badge, sender name/email preview, read/unread indicator
- Click row to expand full submission data
- "Okundu olarak isaretle" toggle per submission
- Unread count shown in admin toolbar badge

## Page Content Seed Data

Initial `page_content` entries (defaults extracted from Stitch designs):

| pageSlug | sectionKey | default content |
|---|---|---|
| home | hero_title | Sinirsiz Sanat |
| home | hero_subtitle | modernizmin sinirlarini zorlayan, renk ve formun dansi. |
| home | new_arrivals_title | yeni gelenler |
| home | new_arrivals_description | son eklenen eserler ve koleksiyonlar. zeynep komur seckisiyle modern sanatin taze solugu. |
| home | quote_text | Her cocuk bir sanatcidir. Sorun, buyudugumuzde sanatci kalmayi nasil basaracagimizdir. |
| home | quote_attribution | Pablo Picasso |
| about | bio_main | ARADA'nin hikayesi, sanati sadece seyredilen bir nesne degil, yasanan bir mekan haline getirme arzusuyla basladi. Istanbul merkezli multidisipliner sanatci Zeynep Komur, modern brutalizm ile geleneksel dokulari harmanlayarak dijital kurasyonun sinirlarini yeniden tanimliyor. |
| about | bio_secondary | Mimar Sinan Guzel Sanatlar Universitesi mezunu olan Komur, on yili askin suredir hem yerel hem de uluslararasi sergilerde eserlerini sergilemekte ve kuratorluk yapmaktadir. |
| contact | headline | arada bag kuralim |
| contact | studio_address | moda, kadikoy, istanbul, turkiye |
| contact | studio_hours | pazartesi - cumartesi, 10:00 - 19:00 |
| contact | studio_email | merhaba@arada.art |
| contact | studio_social | @arada.art |
| ozel-istek | headline | ozellestirilmis resim istegi |
| ozel-istek | description | mekaniniza ruh katacak, sadece size ozel uretilecek bir eser icin kurasyon surecini baslatin. |
| footer | tagline | sanatin herkes icin erisilebilir oldugu, sinirlarin kalktigi dijital bir kurasyon alani. |

## Language

Turkish only. All UI text hardcoded in Turkish. Editable content managed via `page_content` table.
