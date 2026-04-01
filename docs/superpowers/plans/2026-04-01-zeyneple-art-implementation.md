# zeyneple.art Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal portfolio website for artist Zeynep Komur with inline admin editing, artwork management, collection page builder, and contact forms.

**Architecture:** Next.js App Router with SQLite/Drizzle for data, NextAuth for admin auth, Resend for email, filesystem image storage. Docker Compose with Caddy reverse proxy. All pages server-rendered with inline editing when admin is logged in.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Drizzle ORM, SQLite (better-sqlite3), NextAuth v5, Resend, Sharp (image processing), Docker, Caddy

**Spec:** `docs/superpowers/specs/2026-04-01-zeyneple-art-portfolio-design.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout: fonts, metadata, providers
│   ├── page.tsx                      # Homepage
│   ├── not-found.tsx                 # Custom 404
│   ├── galeri/
│   │   └── page.tsx                  # Gallery page
│   ├── hakkinda/
│   │   └── page.tsx                  # About page
│   ├── iletisim/
│   │   └── page.tsx                  # Contact page
│   ├── ozel-istek/
│   │   └── page.tsx                  # Custom painting request page
│   ├── koleksiyon/
│   │   └── [slug]/
│   │       └── page.tsx              # Dynamic collection pages
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx              # Admin login
│   │   └── submissions/
│   │       └── page.tsx              # Form submissions viewer
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts          # NextAuth handlers
│       ├── artworks/
│       │   ├── route.ts              # GET list, POST create
│       │   ├── [id]/
│       │   │   └── route.ts          # GET, PUT, DELETE single artwork
│       │   └── reorder/
│       │       └── route.ts          # PUT reorder
│       ├── uploads/
│       │   └── route.ts              # POST image upload
│       ├── content/
│       │   └── route.ts              # GET, PUT page content
│       ├── collections/
│       │   ├── route.ts              # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts          # PUT, DELETE collection
│       │       └── artworks/
│       │           └── route.ts      # PUT set collection artworks
│       ├── submissions/
│       │   ├── route.ts              # GET list (admin), POST create (public)
│       │   └── [id]/
│       │       └── read/
│       │           └── route.ts      # PUT mark as read
│       └── newsletter/
│           ├── route.ts              # POST subscribe
│           └── count/
│               └── route.ts          # GET count (admin)
├── components/
│   ├── layout/
│   │   ├── navbar.tsx                # Sticky nav with glassmorphic bg
│   │   ├── footer.tsx                # Footer (white + yellow variants)
│   │   └── admin-toolbar.tsx         # Admin-only top bar
│   ├── artwork/
│   │   ├── artwork-card.tsx          # Single artwork card
│   │   ├── artwork-grid.tsx          # Responsive grid with CTA card
│   │   ├── artwork-form-modal.tsx    # Add/edit artwork metadata modal
│   │   ├── category-bar.tsx          # Three color block filters
│   │   └── filter-bar.tsx            # Dropdown filters
│   ├── admin/
│   │   ├── inline-edit.tsx           # Text inline editing wrapper
│   │   ├── image-upload.tsx          # Image upload overlay
│   │   └── toast.tsx                 # Toast notification component
│   ├── forms/
│   │   ├── contact-form.tsx          # "beraber calisalim" form
│   │   ├── question-form.tsx         # "bana her seyi sorabilirsin" form
│   │   ├── custom-request-form.tsx   # Custom painting request form
│   │   └── honeypot-field.tsx        # Hidden honeypot field
│   ├── collection/
│   │   ├── template-grid.tsx         # Grid template layout
│   │   ├── template-showcase.tsx     # Showcase template layout
│   │   ├── template-challenge.tsx    # Challenge template layout
│   │   ├── template-picker.tsx       # Template selection modal
│   │   └── artwork-selector.tsx      # Artwork multi-select for collections
│   └── newsletter-modal.tsx          # Newsletter signup modal
├── lib/
│   ├── db/
│   │   ├── index.ts                  # Drizzle client + SQLite connection
│   │   ├── schema.ts                 # All table schemas
│   │   └── seed.ts                   # Seed page_content defaults
│   ├── auth.ts                       # NextAuth config
│   ├── auth-guard.ts                 # Middleware helper for admin-only routes
│   ├── email.ts                      # Resend email sending
│   ├── upload.ts                     # Image upload + processing (Sharp)
│   ├── rate-limit.ts                 # Simple in-memory rate limiter
│   └── bootstrap.ts                  # Admin user creation on startup
├── hooks/
│   └── use-admin.ts                  # Hook to check if current user is admin
├── providers/
│   └── session-provider.tsx          # NextAuth SessionProvider wrapper
tailwind.config.ts                    # Full design system colors/fonts/tokens
next.config.ts                        # Next.js config
drizzle.config.ts                     # Drizzle config pointing to SQLite
package.json
Dockerfile
docker-compose.yml
Caddyfile
.env.example
```

---

## Chunk 1: Project Scaffold + Database + Auth

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.example`

- [ ] **Step 1: Create Next.js app**

```bash
cd /Users/tahayusufkomur/ws/zeyneple.art
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

Accept defaults. This scaffolds the project.

- [ ] **Step 2: Install dependencies**

```bash
npm install drizzle-orm better-sqlite3 @auth/drizzle-adapter next-auth@beta bcryptjs sharp resend uuid
npm install -D drizzle-kit @types/better-sqlite3 @types/bcryptjs @types/uuid
```

- [ ] **Step 3: Configure Tailwind with design system tokens**

Replace `tailwind.config.ts` with the full design system extracted from Stitch HTML files. Reference: `stitch_designs/arada_yenilenmi_anasayfa_yeni_renkler/code.html` lines 9 for the tailwind config object.

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#004be3",
        "primary-dim": "#0041c8",
        "primary-container": "#819bff",
        "on-primary": "#f2f1ff",
        "on-primary-container": "#001b61",
        "primary-fixed": "#819bff",
        "primary-fixed-dim": "#6c8cff",
        "on-primary-fixed": "#000000",
        "on-primary-fixed-variant": "#002376",
        "inverse-primary": "#6889ff",
        secondary: "#6c5a00",
        "secondary-dim": "#5e4e00",
        "secondary-container": "#ffd709",
        "secondary-fixed": "#ffd709",
        "secondary-fixed-dim": "#efc900",
        "on-secondary": "#fff2cd",
        "on-secondary-container": "#5b4b00",
        "on-secondary-fixed": "#453900",
        "on-secondary-fixed-variant": "#665500",
        tertiary: "#b30065",
        "tertiary-dim": "#9d0058",
        "tertiary-container": "#ff8db7",
        "tertiary-fixed": "#ff8db7",
        "tertiary-fixed-dim": "#ff74ac",
        "on-tertiary": "#ffeff2",
        "on-tertiary-container": "#650036",
        "on-tertiary-fixed": "#37001b",
        "on-tertiary-fixed-variant": "#750040",
        "highlight-pink": "#F28482",
        error: "#b41340",
        "error-dim": "#a70138",
        "error-container": "#f74b6d",
        "on-error": "#ffefef",
        "on-error-container": "#510017",
        background: "#f8f5ff",
        "on-background": "#2a2b51",
        surface: "#f8f5ff",
        "surface-bright": "#f8f5ff",
        "surface-dim": "#d1d0ff",
        "surface-container": "#e8e6ff",
        "surface-container-low": "#f2efff",
        "surface-container-high": "#e1e0ff",
        "surface-container-highest": "#dbd9ff",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#dbd9ff",
        "surface-tint": "#004be3",
        "on-surface": "#2a2b51",
        "on-surface-variant": "#575881",
        outline: "#72739e",
        "outline-variant": "#a9a9d7",
        "inverse-surface": "#08082f",
        "inverse-on-surface": "#9999c6",
        // ozel-istek page specific
        "petrol-blue": "#085F7F",
        "petrol-dim": "#064b65",
        "warm-yellow": "#FFD54F",
        "warm-orange": "#F4A261",
      },
      fontFamily: {
        headline: ["Arimo", "sans-serif"],
        display: ["Arimo", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        label: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0px",
        lg: "0px",
        xl: "0px",
        full: "0px",
        md: "0px",
        sm: "0px",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 4: Create .env.example**

```env
DATABASE_URL=file:./data/zeyneple.db
NEXTAUTH_SECRET=change-me-to-random-string
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxxxxxxxxx
ADMIN_EMAIL=admin@zeyneple.art
ADMIN_PASSWORD=change-me
NOTIFICATION_EMAIL=zeynep@example.com
EMAIL_FROM=noreply@zeyneple.art
```

- [ ] **Step 5: Copy .env.example to .env and fill values**

```bash
cp .env.example .env
```

- [ ] **Step 6: Create .gitignore additions**

Append to `.gitignore`:
```
data/
uploads/
.env
```

- [ ] **Step 7: Verify project starts**

```bash
npm run dev
```

Visit http://localhost:3000 — should see default Next.js page.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: initialize Next.js project with Tailwind design system"
```

---

### Task 2: Database Schema + Drizzle Setup

**Files:**
- Create: `src/lib/db/index.ts`, `src/lib/db/schema.ts`, `drizzle.config.ts`

- [ ] **Step 1: Create Drizzle config**

`drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./data/zeyneple.db",
  },
});
```

- [ ] **Step 2: Create database schema**

`src/lib/db/schema.ts`:
```typescript
import { sqliteTable, text, integer, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const artworks = sqliteTable("artworks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", { enum: ["resim", "dekorasyon", "posterler"] }).notNull(),
  dimensions: text("dimensions").notNull().default(""),
  technique: text("technique").notNull().default(""),
  year: integer("year"),
  availability: text("availability", { enum: ["available", "sold", "contact"] }).notNull().default("available"),
  imagePath: text("image_path").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const pageContent = sqliteTable("page_content", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageSlug: text("page_slug").notNull(),
  sectionKey: text("section_key").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("page_content_unique").on(table.pageSlug, table.sectionKey),
]);

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  templateType: text("template_type", { enum: ["grid", "showcase", "challenge"] }).notNull(),
  metadata: text("metadata").notNull().default("{}"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const collectionArtworks = sqliteTable("collection_artworks", {
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  artworkId: text("artwork_id").notNull().references(() => artworks.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  dayNumber: integer("day_number"),
}, (table) => [
  primaryKey({ columns: [table.collectionId, table.artworkId] }),
]);

export const formSubmissions = sqliteTable("form_submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formType: text("form_type", { enum: ["contact", "custom_request", "question"] }).notNull(),
  data: text("data").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribedAt: text("subscribed_at").notNull().default(sql`(datetime('now'))`),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
});
```

- [ ] **Step 3: Create database client**

`src/lib/db/index.ts`:
```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/zeyneple.db";
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 4: Generate and run initial migration**

```bash
mkdir -p data
npx drizzle-kit generate
npx drizzle-kit migrate
```

- [ ] **Step 5: Verify tables exist**

```bash
npx drizzle-kit studio
```

Open Drizzle Studio and verify all 7 tables are created.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add database schema with Drizzle ORM + SQLite"
```

---

### Task 3: Seed Data + Bootstrap

**Files:**
- Create: `src/lib/db/seed.ts`, `src/lib/bootstrap.ts`

- [ ] **Step 1: Create seed script**

`src/lib/db/seed.ts`:
```typescript
import { db } from "./index";
import { pageContent } from "./schema";
import { sql } from "drizzle-orm";

const defaults = [
  { pageSlug: "home", sectionKey: "hero_title", content: "Sınırsız Sanat" },
  { pageSlug: "home", sectionKey: "hero_subtitle", content: "modernizmin sınırlarını zorlayan, renk ve formun dansı." },
  { pageSlug: "home", sectionKey: "new_arrivals_title", content: "yeni gelenler" },
  { pageSlug: "home", sectionKey: "new_arrivals_description", content: "son eklenen eserler ve koleksiyonlar. zeynep kömür seçkisiyle modern sanatın taze soluğu." },
  { pageSlug: "home", sectionKey: "quote_text", content: "Her çocuk bir sanatçıdır. Sorun, büyüdüğümüzde sanatçı kalmayı nasıl başaracağımızdır." },
  { pageSlug: "home", sectionKey: "quote_attribution", content: "Pablo Picasso" },
  { pageSlug: "about", sectionKey: "bio_main", content: "ARADA'nın hikayesi, sanatı sadece seyredilen bir nesne değil, yaşanan bir mekan haline getirme arzusuyla başladı. İstanbul merkezli multidisipliner sanatçı Zeynep Kömür, modern brutalizm ile geleneksel dokuları harmanlayarak dijital kürasyonun sınırlarını yeniden tanımlıyor." },
  { pageSlug: "about", sectionKey: "bio_secondary", content: "Mimar Sinan Güzel Sanatlar Üniversitesi mezunu olan Kömür, on yılı aşkın süredir hem yerel hem de uluslararası sergilerde eserlerini sergilemekte ve küratörlük yapmaktadır." },
  { pageSlug: "contact", sectionKey: "headline", content: "arada bağ kuralım" },
  { pageSlug: "contact", sectionKey: "studio_address", content: "moda, kadıköy, istanbul, türkiye" },
  { pageSlug: "contact", sectionKey: "studio_hours", content: "pazartesi - cumartesi, 10:00 - 19:00" },
  { pageSlug: "contact", sectionKey: "studio_email", content: "merhaba@arada.art" },
  { pageSlug: "contact", sectionKey: "studio_social", content: "@arada.art" },
  { pageSlug: "ozel-istek", sectionKey: "headline", content: "özelleştirilmiş resim isteği" },
  { pageSlug: "ozel-istek", sectionKey: "description", content: "mekanınıza ruh katacak, sadece size özel üretilecek bir eser için kürasyon sürecini başlatın." },
  { pageSlug: "footer", sectionKey: "tagline", content: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı." },
];

export async function seedPageContent() {
  for (const item of defaults) {
    await db.insert(pageContent).values(item).onConflictDoNothing();
  }
  console.log("[seed] Page content seeded");
}
```

- [ ] **Step 2: Create bootstrap script**

`src/lib/bootstrap.ts`:
```typescript
import { db } from "./db/index";
import { adminUsers } from "./db/schema";
import { seedPageContent } from "./db/seed";
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";

export async function bootstrap() {
  // Run migrations (drizzle-kit push for SQLite)
  // In production, migrations are applied during docker build via `npx drizzle-kit push`
  // At runtime, we just seed data and create admin

  // Seed page content
  await seedPageContent();

  // Bootstrap admin user
  const [{ total }] = await db.select({ total: count() }).from(adminUsers);

  if (total > 0) {
    console.log("[bootstrap] Admin user already exists, skipping");
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("[bootstrap] ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin creation");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(adminUsers).values({ email, passwordHash });
  console.log(`[bootstrap] Admin user created: ${email}`);
}
```

- [ ] **Step 3: Wire bootstrap into app startup**

Create `src/app/layout.tsx` instrumentation or use Next.js `instrumentation.ts`:

`src/instrumentation.ts`:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrap } = await import("./lib/bootstrap");
    await bootstrap();
  }
}
```

Update `next.config.ts` to enable instrumentation:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
};

export default nextConfig;
```

- [ ] **Step 4: Test bootstrap**

```bash
npm run dev
```

Check console output for:
- `[seed] Page content seeded`
- `[bootstrap] Admin user created: admin@zeyneple.art`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add seed data and admin bootstrap on startup"
```

---

### Task 4: NextAuth Configuration

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-guard.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/providers/session-provider.tsx`

- [ ] **Step 1: Create NextAuth config**

`src/lib/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db/index";
import { adminUsers } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, credentials.email as string));

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
});
```

- [ ] **Step 2: Create auth route handler**

`src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create auth guard helper**

`src/lib/auth-guard.ts`:
```typescript
import { auth } from "./auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
```

- [ ] **Step 4: Create SessionProvider wrapper**

`src/providers/session-provider.tsx`:
```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 5: Create useAdmin hook**

`src/hooks/use-admin.ts`:
```typescript
"use client";

import { useSession } from "next-auth/react";

export function useAdmin() {
  const { data: session, status } = useSession();
  return {
    isAdmin: !!session?.user,
    isLoading: status === "loading",
    session,
  };
}
```

- [ ] **Step 6: Wire SessionProvider into root layout**

Update `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Arimo, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/providers/session-provider";
import "./globals.css";

const arimo = Arimo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-arimo",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "arada by zeynep kömür",
  description: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${arimo.variable} ${plusJakarta.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create admin login page**

`src/app/admin/login/page.tsx`:
```typescript
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("geçersiz e-posta veya şifre");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8 p-12 bg-white shadow-sm">
        <h1 className="text-3xl font-bold tracking-tighter text-on-surface lowercase">yönetici girişi</h1>
        {error && <p className="text-error text-sm">{error}</p>}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">e-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-bold tracking-tight lowercase hover:bg-primary-dim transition-all"
        >
          giriş yap
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 8: Test login flow**

```bash
npm run dev
```

1. Visit http://localhost:3000/admin/login
2. Enter credentials from `.env`
3. Should redirect to homepage

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add NextAuth credentials auth with admin login page"
```

---

## Chunk 2: Core API Routes + Utilities

### Task 5: Image Upload Utility

**Files:**
- Create: `src/lib/upload.ts`

- [ ] **Step 1: Create upload utility**

`src/lib/upload.ts`:
```typescript
import sharp from "sharp";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_BASE = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadCategory = "artworks" | "forms" | "pages";

export async function processUpload(
  file: File,
  category: UploadCategory
): Promise<{ path: string; error?: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { path: "", error: "Desteklenmeyen dosya türü. JPEG, PNG veya WebP yükleyin." };
  }

  if (file.size > MAX_SIZE) {
    return { path: "", error: "Dosya boyutu 10MB'ı aşamaz." };
  }

  const dir = path.join(UPLOAD_BASE, category);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const id = uuidv4();
  const buffer = Buffer.from(await file.arrayBuffer());

  // Save original as backup
  const originalPath = path.join(dir, `${id}-original${getExtension(file.type)}`);
  await writeFile(originalPath, buffer);

  // Process: resize + convert to WebP
  const webpPath = path.join(dir, `${id}.webp`);
  await sharp(buffer)
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(webpPath);

  return { path: `/uploads/${category}/${id}.webp` };
}

export async function deleteUpload(filePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), "public", filePath);
  try {
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }
    // Also try to delete original backup
    const dir = path.dirname(fullPath);
    const id = path.basename(fullPath, ".webp");
    const originals = ["jpg", "png", "webp"].map(
      (ext) => path.join(dir, `${id}-original.${ext}`)
    );
    for (const orig of originals) {
      if (existsSync(orig)) await unlink(orig);
    }
  } catch (e) {
    console.error("[upload] Failed to delete file:", filePath, e);
  }
}

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    default: return ".bin";
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add image upload utility with Sharp processing"
```

---

### Task 6: Rate Limiter + Email Utility

**Files:**
- Create: `src/lib/rate-limit.ts`, `src/lib/email.ts`

- [ ] **Step 1: Create rate limiter**

`src/lib/rate-limit.ts`:
```typescript
const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup stale entries every 5 minutes (guard against HMR duplicate intervals)
const globalForRateLimit = globalThis as unknown as { _rateLimitCleanup?: NodeJS.Timeout };
if (!globalForRateLimit._rateLimitCleanup) {
  globalForRateLimit._rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requests.entries()) {
      if (now > value.resetAt) requests.delete(key);
    }
  }, 5 * 60 * 1000);
}
```

- [ ] **Step 2: Create email utility**

`src/lib/email.ts`:
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type FormEmailData = {
  formType: "contact" | "custom_request" | "question";
  data: Record<string, string>;
};

export async function sendFormNotification({ formType, data }: FormEmailData) {
  const to = process.env.NOTIFICATION_EMAIL;
  const from = process.env.EMAIL_FROM || "noreply@zeyneple.art";

  if (!to) {
    console.warn("[email] NOTIFICATION_EMAIL not set, skipping");
    return;
  }

  const { subject, body } = formatEmail(formType, data);

  try {
    await resend.emails.send({ from, to, subject, text: body });
  } catch (error) {
    console.error("[email] Failed to send notification:", error);
    // Do not throw — submission is already saved to DB
  }
}

function formatEmail(formType: string, data: Record<string, string>) {
  switch (formType) {
    case "contact":
      return {
        subject: `[arada] Yeni iletişim: ${data.name || ""}`,
        body: `İsim: ${data.name}\nE-posta: ${data.email}\n\nMesaj:\n${data.description}`,
      };
    case "question":
      return {
        subject: "[arada] Yeni soru",
        body: `E-posta: ${data.email}\n\nSoru:\n${data.question}`,
      };
    case "custom_request":
      return {
        subject: `[arada] Özel resim isteği: ${data.firstName} ${data.lastName}`,
        body: `İsim: ${data.firstName} ${data.lastName}\nE-posta: ${data.email}\n\nAçıklama:\n${data.description}`,
      };
    default:
      return {
        subject: "[arada] Yeni form gönderimi",
        body: JSON.stringify(data, null, 2),
      };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add rate limiter and Resend email utility"
```

---

### Task 7: API Routes — Artworks

**Files:**
- Create: `src/app/api/artworks/route.ts`, `src/app/api/artworks/[id]/route.ts`, `src/app/api/artworks/reorder/route.ts`, `src/app/api/uploads/route.ts`

- [ ] **Step 1: Create artworks list/create route**

`src/app/api/artworks/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { asc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const results = category
    ? await db.select().from(artworks).where(eq(artworks.category, category)).orderBy(asc(artworks.sortOrder))
    : await db.select().from(artworks).orderBy(asc(artworks.sortOrder));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const [artwork] = await db.insert(artworks).values({
    title: body.title,
    description: body.description,
    category: body.category,
    dimensions: body.dimensions || "",
    technique: body.technique || "",
    year: body.year || null,
    availability: body.availability || "available",
    imagePath: body.imagePath,
    sortOrder: body.sortOrder || 0,
  }).returning();

  return NextResponse.json(artwork, { status: 201 });
}
```

- [ ] **Step 2: Create single artwork route**

`src/app/api/artworks/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";
import { deleteUpload } from "@/lib/upload";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));

  if (!artwork) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(artwork);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(artworks)
    .set({ ...body, updatedAt: sql`(datetime('now'))` })
    .where(eq(artworks.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));

  if (!artwork) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete image file
  await deleteUpload(artwork.imagePath);

  // Delete from DB (cascade will handle collection_artworks)
  await db.delete(artworks).where(eq(artworks.id, id));

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create reorder route**

`src/app/api/artworks/reorder/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body: { id: string; sortOrder: number }[] = await request.json();

  for (const item of body) {
    await db.update(artworks).set({ sortOrder: item.sortOrder }).where(eq(artworks.id, item.id));
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create upload route**

`src/app/api/uploads/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { processUpload, UploadCategory } from "@/lib/upload";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as UploadCategory) || "artworks";

  // "forms" category uploads are allowed without auth (custom request form)
  // All other categories require admin
  if (category !== "forms") {
    const authError = await requireAdmin();
    if (authError) return authError;
  }

  if (!file) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }

  const result = await processUpload(file, category);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ path: result.path });
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add artwork CRUD + upload API routes"
```

---

### Task 8: API Routes — Content, Collections, Submissions, Newsletter

**Files:**
- Create: `src/app/api/content/route.ts`, `src/app/api/collections/route.ts`, `src/app/api/collections/[id]/route.ts`, `src/app/api/collections/[id]/artworks/route.ts`, `src/app/api/submissions/route.ts`, `src/app/api/submissions/[id]/read/route.ts`, `src/app/api/newsletter/route.ts`, `src/app/api/newsletter/count/route.ts`

- [ ] **Step 1: Create content route**

`src/app/api/content/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageContent } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const section = searchParams.get("section");

  if (!page) {
    return NextResponse.json({ error: "page parameter required" }, { status: 400 });
  }

  const conditions = section
    ? and(eq(pageContent.pageSlug, page), eq(pageContent.sectionKey, section))
    : eq(pageContent.pageSlug, page);

  const results = await db.select().from(pageContent).where(conditions);
  return NextResponse.json(results);
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const { pageSlug, sectionKey, content } = body;

  const [updated] = await db
    .update(pageContent)
    .set({ content, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(pageContent.pageSlug, pageSlug), eq(pageContent.sectionKey, sectionKey)))
    .returning();

  if (!updated) {
    // Create if doesn't exist
    const [created] = await db.insert(pageContent).values({ pageSlug, sectionKey, content }).returning();
    return NextResponse.json(created);
  }

  return NextResponse.json(updated);
}
```

- [ ] **Step 2: Create collections routes**

`src/app/api/collections/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  const isAdmin = !!session?.user;

  // Public users only see published collections
  const results = isAdmin
    ? await db.select().from(collections).orderBy(asc(collections.createdAt))
    : await db.select().from(collections).where(eq(collections.isPublished, true)).orderBy(asc(collections.createdAt));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const [collection] = await db.insert(collections).values({
    title: body.title,
    slug: body.slug,
    description: body.description || "",
    templateType: body.templateType,
    metadata: JSON.stringify(body.metadata || {}),
    isPublished: body.isPublished || false,
  }).returning();

  return NextResponse.json(collection, { status: 201 });
}
```

`src/app/api/collections/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, sql } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  if (body.metadata && typeof body.metadata === "object") {
    body.metadata = JSON.stringify(body.metadata);
  }

  const [updated] = await db
    .update(collections)
    .set({ ...body, updatedAt: sql`(datetime('now'))` })
    .where(eq(collections.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  await db.delete(collections).where(eq(collections.id, id));
  return NextResponse.json({ success: true });
}
```

`src/app/api/collections/[id]/artworks/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collectionArtworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body: { artworkId: string; sortOrder: number; dayNumber?: number }[] = await request.json();

  // Replace all artworks for this collection
  await db.delete(collectionArtworks).where(eq(collectionArtworks.collectionId, id));

  if (body.length > 0) {
    await db.insert(collectionArtworks).values(
      body.map((item) => ({
        collectionId: id,
        artworkId: item.artworkId,
        sortOrder: item.sortOrder,
        dayNumber: item.dayNumber || null,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create submissions routes**

`src/app/api/submissions/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formSubmissions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { sendFormNotification } from "@/lib/email";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const results = await db.select().from(formSubmissions).orderBy(desc(formSubmissions.createdAt));
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bir dakika bekleyin." }, { status: 429 });
  }

  const body = await request.json();
  const { formType, data } = body;

  // Honeypot check
  if (data._honey) {
    return NextResponse.json({ success: true }); // Silently accept but don't save
  }

  // Validate formType
  if (!["contact", "custom_request", "question"].includes(formType)) {
    return NextResponse.json({ error: "Geçersiz form türü" }, { status: 400 });
  }

  // Per-form-type field validation
  const validationError = validateFormData(formType, data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const [submission] = await db.insert(formSubmissions).values({
    formType,
    data: JSON.stringify(data),
  }).returning();

  // Send email notification (fire and forget)
  sendFormNotification({ formType, data });

  return NextResponse.json(submission, { status: 201 });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFormData(formType: string, data: Record<string, string>): string | null {
  if (!data.email || !emailRegex.test(data.email)) return "Geçersiz e-posta adresi";

  switch (formType) {
    case "contact":
      if (!data.name || data.name.length > 100) return "İsim gerekli (max 100 karakter)";
      if (!data.description || data.description.length > 2000) return "Açıklama gerekli (max 2000 karakter)";
      break;
    case "question":
      if (!data.question || data.question.length > 2000) return "Soru gerekli (max 2000 karakter)";
      break;
    case "custom_request":
      if (!data.firstName || data.firstName.length > 50) return "Ad gerekli (max 50 karakter)";
      if (!data.lastName || data.lastName.length > 50) return "Soyad gerekli (max 50 karakter)";
      if (!data.description || data.description.length > 2000) return "Açıklama gerekli (max 2000 karakter)";
      break;
  }
  return null;
}
```

`src/app/api/submissions/[id]/read/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formSubmissions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(formSubmissions)
    .set({ isRead: body.isRead ?? true })
    .where(eq(formSubmissions.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
```

- [ ] **Step 4: Create newsletter routes**

`src/app/api/newsletter/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const body = await request.json();
  const { email, name } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
  }

  try {
    await db.insert(newsletterSubscribers).values({ email, name: name || null });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "zaten kayıtlısınız" }, { status: 409 });
    }
    throw e;
  }
}
```

`src/app/api/newsletter/count/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { count } from "drizzle-orm";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const [{ total }] = await db.select({ total: count() }).from(newsletterSubscribers);
  return NextResponse.json({ count: total });
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add content, collections, submissions, newsletter API routes"
```

---

## Chunk 3: Shared Components + Admin Components

### Task 9: Layout Components (Navbar, Footer, AdminToolbar)

**Files:**
- Create: `src/components/layout/navbar.tsx`, `src/components/layout/footer.tsx`, `src/components/layout/admin-toolbar.tsx`

- [ ] **Step 1: Create Navbar component**

`src/components/layout/navbar.tsx` — translate directly from `stitch_designs/arada_yenilenmi_anasayfa_yeni_renkler/code.html` lines 19-29. Must include:
- Sticky positioning with `bg-white/80 backdrop-blur-md`
- Logo: "arada by zeynep kömür" or "arada zeynep kömür" depending on page (use homepage variant as canonical)
- Nav links: anasayfa, galeri, hakkında, iletişim (lowercase, Plus Jakarta Sans)
- Active link styling with yellow underline or primary border
- "KULÜBE KATIL" button that triggers newsletter modal
- Mobile hamburger menu
- Accept `currentPage` prop for active state

- [ ] **Step 2: Create Footer component**

`src/components/layout/footer.tsx` — two variants based on designs:
- **White variant** (homepage, about, contact): from `stitch_designs/arada_yenilenmi_anasayfa_yeni_renkler/code.html` lines 108-134
- **Yellow variant** (gallery): from `stitch_designs/arada_yenilenmi_galeri_yeni_renkler/code.html` lines 189-207
- Accept `variant` prop: `"white" | "yellow"`
- Include editable tagline via `InlineEdit` for admin

- [ ] **Step 3: Create AdminToolbar component**

`src/components/layout/admin-toolbar.tsx`:
```typescript
"use client";

import { useAdmin } from "@/hooks/use-admin";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminToolbar() {
  const { isAdmin } = useAdmin();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        const unread = data.filter((s: any) => !s.isRead).length;
        setUnreadCount(unread);
      });

    fetch("/api/newsletter/count")
      .then((r) => r.json())
      .then((data) => setSubscriberCount(data.count));
  }, [isAdmin, pathname]);

  if (!isAdmin) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-inverse-surface text-inverse-on-surface px-6 py-2 flex items-center justify-between text-xs font-body">
      <div className="flex items-center gap-6">
        <span className="font-bold uppercase tracking-widest">admin</span>
        <span className="text-inverse-on-surface/60">{pathname}</span>
      </div>
      <div className="flex items-center gap-6">
        <Link href="/admin/submissions" className="hover:text-secondary-container transition-colors">
          gönderiler {unreadCount > 0 && <span className="bg-error text-on-error px-2 py-0.5 ml-1">{unreadCount}</span>}
        </Link>
        <span className="text-inverse-on-surface/60">
          bülten: {subscriberCount}
        </span>
        <button onClick={() => signOut()} className="hover:text-error transition-colors">
          çıkış
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Navbar, Footer, and AdminToolbar layout components"
```

---

### Task 10: Admin Inline Editing Components

**Files:**
- Create: `src/components/admin/inline-edit.tsx`, `src/components/admin/image-upload.tsx`, `src/components/admin/toast.tsx`, `src/hooks/use-inline-edit.ts`

- [ ] **Step 1: Create toast component**

`src/components/admin/toast.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error";

let showToastFn: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "success") {
  showToastFn?.(message, type);
}

export function ToastProvider() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    showToastFn = (message, type) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };
    return () => { showToastFn = null; };
  }, []);

  if (!toast) return null;

  return (
    <div className={`fixed bottom-8 right-8 z-[200] px-6 py-3 shadow-lg text-sm font-bold lowercase ${
      toast.type === "success"
        ? "bg-primary text-on-primary"
        : "bg-error text-on-error"
    }`}>
      {toast.message}
    </div>
  );
}
```

- [ ] **Step 2: Create InlineEdit component**

`src/components/admin/inline-edit.tsx`:
```typescript
"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useState, useRef, useEffect } from "react";
import { showToast } from "./toast";

type InlineEditProps = {
  pageSlug: string;
  sectionKey: string;
  initialContent: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "blockquote";
  className?: string;
  multiline?: boolean;
};

export function InlineEdit({
  pageSlug,
  sectionKey,
  initialContent,
  as: Tag = "span",
  className = "",
  multiline = false,
}: InlineEditProps) {
  const { isAdmin } = useAdmin();
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  if (!isAdmin) {
    return <Tag className={className}>{content}</Tag>;
  }

  if (editing) {
    const InputTag = multiline ? "textarea" : "input";
    return (
      <InputTag
        ref={inputRef as any}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (!multiline && e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setContent(initialContent);
            setEditing(false);
          }
        }}
        className={`${className} outline-2 outline-primary/50 outline-dashed bg-transparent w-full resize-none`}
        rows={multiline ? 4 : undefined}
      />
    );
  }

  return (
    <Tag
      className={`${className} cursor-pointer hover:outline-2 hover:outline-primary/30 hover:outline-dashed group relative`}
      onClick={() => setEditing(true)}
    >
      {content}
      <span className="material-symbols-outlined absolute -top-3 -right-3 text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 shadow-sm">
        edit
      </span>
    </Tag>
  );

  async function handleSave() {
    if (content === initialContent) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageSlug, sectionKey, content }),
      });

      if (!res.ok) throw new Error();
      showToast("kaydedildi", "success");
    } catch {
      setContent(initialContent);
      showToast("kaydedilemedi, tekrar deneyin", "error");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }
}
```

- [ ] **Step 3: Create ImageUpload component**

`src/components/admin/image-upload.tsx`:
```typescript
"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useState, useRef } from "react";
import { showToast } from "./toast";

type ImageUploadProps = {
  currentSrc: string;
  category?: "artworks" | "forms" | "pages";
  onUpload: (newPath: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function ImageUpload({
  currentSrc,
  category = "artworks",
  onUpload,
  className = "",
  children,
}: ImageUploadProps) {
  const { isAdmin } = useAdmin();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`${className} relative group`}>
      {children}
      <div
        className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <span className="material-symbols-outlined text-white text-4xl animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-white text-4xl">upload</span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const { path } = await res.json();
      onUpload(path);
      showToast("görsel yüklendi", "success");
    } catch (err: any) {
      showToast(err.message || "yükleme başarısız", "error");
    } finally {
      setUploading(false);
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add inline edit, image upload, and toast admin components"
```

---

### Task 11: Artwork Components

**Files:**
- Create: `src/components/artwork/artwork-card.tsx`, `src/components/artwork/artwork-grid.tsx`, `src/components/artwork/artwork-form-modal.tsx`, `src/components/artwork/category-bar.tsx`, `src/components/artwork/filter-bar.tsx`

- [ ] **Step 1: Create ArtworkCard**

`src/components/artwork/artwork-card.tsx` — translate from `stitch_designs/arada_fiyat_bilgisi_kald_r_lm_galeri/code.html` lines 86-97 (the card structure without prices). Must include:
- 3:4 aspect ratio image container with hover scale
- Title, description, "fiyat için iletişime geçin" label
- Admin mode: delete button, click to edit

- [ ] **Step 2: Create ArtworkGrid**

`src/components/artwork/artwork-grid.tsx` — responsive grid from gallery design. 1/2/3/4 column layout with gap-10. Include CTA card ("hayalindeki eseri beraber tasarlayalım") as integrated element. Admin mode: "+ Yeni Eser Ekle" floating button, drag reorder.

- [ ] **Step 3: Create ArtworkFormModal**

`src/components/artwork/artwork-form-modal.tsx` — modal for add/edit with fields: image upload, title, description, category dropdown, dimensions, technique, year, availability. Save/cancel buttons.

- [ ] **Step 4: Create CategoryBar**

`src/components/artwork/category-bar.tsx` — three color blocks from `stitch_designs/arada_fiyat_bilgisi_kald_r_lm_galeri/code.html` lines 33-47. Blue (resim), yellow (dekorasyon), pink (posterler).

- [ ] **Step 5: Create FilterBar**

`src/components/artwork/filter-bar.tsx` — dropdowns from gallery design lines 49-82. Filters: renk, boyut, koleksiyon.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add artwork card, grid, form modal, category and filter components"
```

---

### Task 12: Form Components + Newsletter Modal

**Files:**
- Create: `src/components/forms/contact-form.tsx`, `src/components/forms/question-form.tsx`, `src/components/forms/custom-request-form.tsx`, `src/components/forms/honeypot-field.tsx`, `src/components/newsletter-modal.tsx`

- [ ] **Step 1: Create honeypot field**

`src/components/forms/honeypot-field.tsx`:
```typescript
export function HoneypotField() {
  return (
    <div className="absolute -left-[9999px]" aria-hidden="true">
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
```

- [ ] **Step 2: Create ContactForm**

`src/components/forms/contact-form.tsx` — translate from `stitch_designs/arada_i_leti_im_sar_kelime_vurgulu/code.html` lines 52-65 ("beraber çalışalım" section). Fields: name, email, description. Validation, error display, honeypot.

- [ ] **Step 3: Create QuestionForm**

`src/components/forms/question-form.tsx` — from contact design lines 76-84 ("bana her şeyi sorabilirsin" section). Fields: question, email. Different styling (yellow accent).

- [ ] **Step 4: Create CustomRequestForm**

`src/components/forms/custom-request-form.tsx` — from `stitch_designs/arada_unified_branding_palette_zel_i_stek/code.html` lines 46-79. Fields: first name, last name, email, photo upload, description.

**Image upload flow:** The form uses a two-step process: (1) user selects photo → immediately uploads to `/api/uploads` with `category=forms`, gets back a path; (2) on form submit, the image path is included in the JSON data sent to `/api/submissions`. This avoids multipart in the submissions endpoint. The upload button shows a preview of the uploaded image after success.

- [ ] **Step 5: Create NewsletterModal**

`src/components/newsletter-modal.tsx` — modal triggered by "KULÜBE KATIL" button. Email + optional name. Submit to `/api/newsletter`. Show success/duplicate messages.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add contact, question, custom request forms and newsletter modal"
```

---

## Chunk 4: Pages

### Task 13: Root Layout Update + Homepage

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Update root layout to include AdminToolbar + Toast**

Add `<AdminToolbar />` and `<ToastProvider />` to `src/app/layout.tsx` body. This MUST be done before any page tasks, as all pages depend on these providers.

- [ ] **Step 2: Build homepage**

Translate directly from `stitch_designs/arada_yenilenmi_anasayfa_yeni_renkler/code.html`. Server component that:
- Fetches page_content for "home" slug
- Fetches latest artworks for "yeni gelenler" section
- Renders: Navbar (currentPage="anasayfa"), Hero section (with InlineEdit for title/subtitle), Bento grid of new artworks, Quote section (with InlineEdit), Color divider, Footer (variant="white")

**Important design fidelity note:** The bento grid uses `grid-cols-4 grid-rows-2` with a large 2x2 card, a vertical card, a pink highlight square, and a wide bottom card. Copy the exact grid structure from the Stitch HTML.

- [ ] **Step 3: Test homepage renders**

```bash
npm run dev
```

Visit http://localhost:3000 — should match homepage design.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add homepage with hero, bento grid, and quote sections"
```

---

### Task 14: Gallery Page

**Files:**
- Create: `src/app/galeri/page.tsx`

- [ ] **Step 1: Build gallery page**

Translate from `stitch_designs/arada_fiyat_bilgisi_kald_r_lm_galeri/code.html`. Server component wrapping client interactive parts:
- CategoryBar (3 color blocks)
- FilterBar (dropdowns)
- ArtworkGrid with all artworks
- CTA card for custom requests
- Artist quote section
- Footer (yellow variant)
- Admin mode: add/edit/delete/reorder artworks

- [ ] **Step 2: Test gallery page**

Visit http://localhost:3000/galeri — should show category blocks, filters, artwork grid.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add gallery page with filters and artwork grid"
```

---

### Task 15: About Page

**Files:**
- Create: `src/app/hakkinda/page.tsx`

- [ ] **Step 1: Build about page**

Translate from `stitch_designs/arada_yenilenmi_hakk_nda_yeni_renkler/code.html`. Includes:
- Portrait with yellow accent block and "kurucu & küratör" label
- Name heading with primary color accent
- Bio text (InlineEdit for admin)
- Skill tags (dijital sanat, kürasyon, fotoğrafçılık)
- Footer with contact links

- [ ] **Step 2: Test about page**

Visit http://localhost:3000/hakkinda — should match about design.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add about page with portrait and bio"
```

---

### Task 16: Contact Page

**Files:**
- Create: `src/app/iletisim/page.tsx`

- [ ] **Step 1: Build contact page**

Translate from `stitch_designs/arada_i_leti_im_sar_kelime_vurgulu/code.html`. Includes:
- Large headline "arada bağ kuralım" (InlineEdit)
- "beraber çalışalım" section with ContactForm
- Pink divider
- "bana her şeyi sorabilirsin" section with QuestionForm
- Studio info grid (address, hours, email — all InlineEdit)
- Footer (variant="white")

- [ ] **Step 2: Test forms submit**

1. Fill out contact form → should save to DB and (if Resend configured) send email
2. Fill out question form → same behavior

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add contact page with two form sections"
```

---

### Task 17: Custom Painting Request Page

**Files:**
- Create: `src/app/ozel-istek/page.tsx`

- [ ] **Step 1: Build custom request page**

Translate from `stitch_designs/arada_unified_branding_palette_zel_i_stek/code.html`. Note: this page uses petrol-blue/warm-orange colors. Includes:
- Headline + description (InlineEdit)
- Two-column layout: form on left, visual + feature cards on right
- CustomRequestForm with image upload
- Feature cards: renk kürasyonu, boyut ve oran, imzalı hikaye
- Footer (variant="white")

- [ ] **Step 2: Test**

Visit http://localhost:3000/ozel-istek and submit form with file upload.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add custom painting request page with file upload"
```

---

### Task 18: Collection Pages

**Files:**
- Create: `src/app/koleksiyon/[slug]/page.tsx`, `src/components/collection/template-grid.tsx`, `src/components/collection/template-showcase.tsx`, `src/components/collection/template-challenge.tsx`, `src/components/collection/template-picker.tsx`, `src/components/collection/artwork-selector.tsx`

- [ ] **Step 1: Create collection templates**

- `template-grid.tsx` — standard artwork grid layout
- `template-showcase.tsx` — hero + bento layout (like homepage "yeni gelenler")
- `template-challenge.tsx` — translate from `stitch_designs/arada_30_g_n_mini_koleksiyonu/code.html`. Numbered items, badge, format info, buy/sold status

- [ ] **Step 2: Create template picker + artwork selector**

- `template-picker.tsx` — modal with 3 template options (grid/showcase/challenge)
- `artwork-selector.tsx` — checkbox list to pick artworks from gallery

- [ ] **Step 3: Create dynamic collection page**

`src/app/koleksiyon/[slug]/page.tsx` — server component that:
- Fetches collection by slug
- Fetches associated artworks via collection_artworks
- Renders correct template based on `templateType`
- Admin mode: inline edit title/description, artwork selector
- "+ Yeni Koleksiyon" button (visible to admin on gallery page AND in admin toolbar). Flow: click → template picker modal → fill title/slug/description → create via POST `/api/collections` → redirect to `/koleksiyon/[slug]` → select artworks via artwork-selector modal → save via PUT `/api/collections/[id]/artworks`

- [ ] **Step 4: Test with seed collection**

Create a test collection via API, visit `/koleksiyon/test-slug`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add collection pages with three template layouts"
```

---

### Task 19: Admin Submissions Page

**Files:**
- Create: `src/app/admin/submissions/page.tsx`

- [ ] **Step 1: Build submissions page**

No Stitch design — functional admin aesthetic matching the site's typography and colors:
- Tab filters: Tümü / İletişim / Özel İstek / Soru
- List view with date, type badge, sender preview, read/unread
- Click to expand full submission data
- Toggle "okundu" status
- Protected by auth: use `auth()` server-side at the top of the page component. If no session, `redirect("/admin/login")` (from `next/navigation`). Import `auth` from `@/lib/auth`.

- [ ] **Step 2: Test**

Login as admin, visit `/admin/submissions`, verify submissions display.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add admin submissions page with filters and read status"
```

---

### Task 20: 404 Page

**Files:**
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create custom 404**

```typescript
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function NotFound() {
  return (
    <>
      <Navbar currentPage="" />
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-8">
        <h1 className="text-8xl font-bold tracking-tighter text-primary lowercase mb-6">404</h1>
        <p className="text-2xl text-on-surface-variant lowercase mb-12">sayfa bulunamadı</p>
        <Link
          href="/"
          className="bg-primary text-on-primary px-8 py-4 font-bold tracking-tight lowercase hover:bg-primary-dim transition-all"
        >
          anasayfaya dön
        </Link>
      </main>
      <Footer variant="white" />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add custom 404 page"
```

---

## Chunk 5: Deployment + Final Polish

### Task 21: Docker Setup

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `Caddyfile`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN mkdir -p data public/uploads/artworks public/uploads/forms public/uploads/pages
RUN chown -R nextjs:nodejs data public/uploads

COPY scripts/backup.sh /app/scripts/backup.sh
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/backup.sh /app/scripts/entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
```

- [ ] **Step 2: Update next.config.ts for standalone output**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 3: Create docker-compose.yml**

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    restart: unless-stopped

  app:
    build: .
    expose:
      - "3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/public/uploads
    env_file:
      - .env
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
```

- [ ] **Step 4: Create Caddyfile**

```
:80 {
    reverse_proxy app:3000
}
```

- [ ] **Step 5: Create backup cron script**

Create `scripts/backup.sh`:
```bash
#!/bin/sh
BACKUP_DIR="/app/data/backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
cp /app/data/zeyneple.db "$BACKUP_DIR/zeyneple_$DATE.db" 2>&1 || echo "[backup] FAILED: $(date)"

# Keep last 30 days
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete 2>/dev/null
echo "[backup] Completed: $DATE"
```

Create `scripts/entrypoint.sh`:
```bash
#!/bin/sh
# Start crond in background (runs as root, executes nextjs user's crontab)
crond -b -l 8
# Start Next.js
exec node server.js
```

Note: The Dockerfile copies both `backup.sh` and `entrypoint.sh` before switching to `nextjs` user. The cron setup needs to happen before `USER nextjs`. Add to Dockerfile (before the COPY/chmod lines already added):
```dockerfile
RUN echo "0 3 * * * /bin/sh /app/scripts/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/nextjs
```

- [ ] **Step 6: Test Docker build**

```bash
docker compose build
docker compose up -d
```

Visit http://localhost — site should load through Caddy.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add Docker Compose with Caddy reverse proxy and backup script"
```

---

### Task 22: Final Integration + Smoke Test

- [ ] **Step 1: Full smoke test checklist**

Run through each flow:

1. **Homepage** loads with correct design
2. **Gallery** shows artworks (empty initially), category bars, filters
3. **About** shows portrait placeholder, bio text
4. **Contact** forms submit successfully
5. **Custom Request** form with file upload works
6. **Newsletter** modal opens, subscribe works
7. **Admin Login** works with env credentials
8. **Admin toolbar** appears when logged in
9. **Inline editing** — edit homepage title, save, refresh, verify persisted
10. **Add artwork** via gallery admin UI
11. **404** page shows for invalid routes
12. **Docker** compose runs cleanly

- [ ] **Step 2: Fix any issues found during smoke test**

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "chore: final integration fixes after smoke test"
```

---

## Task Dependency Graph

```
Task 1 (scaffold) → Task 2 (DB) → Task 3 (seed) → Task 4 (auth)
                                                         ↓
Task 5 (upload) → Task 7 (artwork API)              Task 6 (rate limit + email)
                                                         ↓
Task 8 (remaining APIs) ← ← ← ← ← ← ← ← ← ← ← ← ← ←
         ↓
Task 9 (layout components) → Task 10 (admin components) → Task 11 (artwork components) → Task 12 (forms)
         ↓
Task 13 (root layout + homepage) — MUST run first among page tasks (updates root layout)
         ↓
Task 14-20 (remaining pages) — can be parallelized:
  - Task 14 (gallery)
  - Task 15 (about)
  - Task 16 (contact)
  - Task 17 (custom request)
  - Task 18 (collections)
  - Task 19 (submissions)
  - Task 20 (404)
         ↓
Task 21 (docker) → Task 22 (smoke test)
```

Tasks 14-20 can be parallelized with subagents since they are independent pages. Task 13 must complete first as it modifies the root layout that all other pages depend on.
