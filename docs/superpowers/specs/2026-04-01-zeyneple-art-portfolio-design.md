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

### collection_artworks

| Field | Type | Notes |
|---|---|---|
| collectionId | text (uuid) | FK → collections |
| artworkId | text (uuid) | FK → artworks |
| sortOrder | integer | |

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
2. **Showcase** — hero image with featured artworks in asymmetric bento layout (like homepage "yeni gelenler")
3. **Challenge** — numbered items with badge/day number, format info, technique label, buy/sold status (like the 30-day mini collection design)

## Forms

Three form types, all stored in `form_submissions` + email notification via Resend:

1. **Contact ("beraber calisalim")** — name, email, project description
2. **Question ("bana her seyi sorabilirsin")** — question text, email for reply
3. **Custom Painting Request** — first name, last name, email, space photo upload, description

## Newsletter

- "KULUBE KATIL" button in navbar triggers modal
- Collects email + optional name
- Duplicate email shows friendly "zaten kayitlisiniz" message
- Subscriber count visible in admin toolbar

## Pricing Display

All artworks show "fiyat icin iletisime gecin" (contact for price). No prices displayed on the public site.

## Design Fidelity

This is critical. The Stitch designs are the source of truth:

- Each page component built by directly translating the Stitch HTML into React/JSX
- Exact Tailwind config from the design HTML files (colors, fonts, border-radius: 0px)
- Preserve all hover effects, transitions, responsive breakpoints
- Color palette: primary `#004be3`, secondary-container `#ffd709`, tertiary `#b30065`, highlight-pink `#F28482`, background `#f8f5ff`
- Fonts: Arimo (headlines), Plus Jakarta Sans (body)
- No 1px borders — separation via color blocking and whitespace
- All branding and nav lowercase
- Material Symbols Outlined for icons

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

### Backup

- Daily cron inside app container: copies SQLite DB to `data/backups/` with timestamp
- Keep last 30 days

## Language

Turkish only. All UI text hardcoded in Turkish. Editable content managed via `page_content` table.
