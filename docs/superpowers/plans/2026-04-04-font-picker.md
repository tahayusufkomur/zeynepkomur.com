# Font Picker & Size Selector Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-field font picker (full Google Fonts) and font size slider to all editable text fields.

**Architecture:** Store font styles in `page_content` (for InlineEdit fields) and a new `field_styles` table (for artwork/collection fields). Ship a static Google Fonts JSON catalog. Floating toolbar component shared by both InlineEdit and a new StyleableText wrapper. Server-side font preloading via `<link>` tags.

**Tech Stack:** Next.js 16, React, Drizzle ORM, better-sqlite3, TypeScript, Tailwind CSS, Google Fonts CSS API

**Spec:** `docs/superpowers/specs/2026-04-04-font-picker-design.md`

---

## Chunk 1: Foundation (schema, fonts data, utilities)

### Task 1: Add field_styles table

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/migrate.ts`

- [ ] **Step 1: Add fieldStyles to Drizzle schema**

In `src/lib/db/schema.ts`, add after the `artworkImages` table:

```typescript
export const fieldStyles = sqliteTable("field_styles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  fieldName: text("field_name").notNull(),
  fontFamily: text("font_family").notNull(),
  fontSize: integer("font_size").notNull(),
}, (table) => [
  uniqueIndex("field_styles_unique").on(table.entityType, table.entityId, table.fieldName),
]);
```

- [ ] **Step 2: Add migration**

In `src/lib/db/migrate.ts`, before `sqlite.close()`, add:

```typescript
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS field_styles (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    font_family TEXT NOT NULL,
    font_size INTEGER NOT NULL,
    UNIQUE(entity_type, entity_id, field_name)
  );
`);
```

- [ ] **Step 3: Run migration**

```bash
npx tsx -e "require('./src/lib/db/migrate').migrate()"
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/migrate.ts
git commit -m "feat: add field_styles table for per-field font customization"
```

### Task 2: Create Google Fonts catalog

**Files:**
- Create: `src/data/google-fonts.json`

- [ ] **Step 1: Generate the font catalog**

Fetch the Google Fonts catalog and save as a slim JSON. Run this one-time script:

```bash
curl -s "https://fonts.google.com/metadata/fonts" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const raw = Buffer.concat(chunks).toString();
  // Google prefixes with )]}' on first line
  const json = JSON.parse(raw.replace(/^\)\]\}'\n/, ''));
  const fonts = json.familyMetadataList.map(f => ({
    family: f.family,
    category: f.category
  })).slice(0, 1500);
  console.log(JSON.stringify(fonts));
});" > src/data/google-fonts.json
```

If the curl approach doesn't work (API structure may vary), create a minimal catalog manually with ~200 popular fonts. The JSON structure should be:

```json
[
  { "family": "Inter", "category": "sans-serif" },
  { "family": "Playfair Display", "category": "serif" },
  ...
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/google-fonts.json
git commit -m "feat: add Google Fonts catalog JSON"
```

### Task 3: Create font utilities

**Files:**
- Create: `src/lib/fonts.ts`

- [ ] **Step 1: Create font utilities**

Create `src/lib/fonts.ts`:

```typescript
import { db } from "@/lib/db";
import { pageContent, fieldStyles } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export type FieldStyle = {
  fontFamily: string;
  fontSize: number;
};

/** Build a Google Fonts CSS URL for the given families */
export function buildGoogleFontsUrl(families: string[]): string | null {
  const unique = [...new Set(families)];
  if (unique.length === 0) return null;
  const params = unique.map((f) => `family=${encodeURIComponent(f)}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** Get all custom fonts used in page_content style rows for a page */
export async function getPageFonts(pageSlug: string): Promise<string[]> {
  const rows = await db
    .select({ content: pageContent.content })
    .from(pageContent)
    .where(eq(pageContent.pageSlug, pageSlug));

  const fonts: string[] = [];
  for (const row of rows) {
    if (row.content.startsWith("{")) {
      try {
        const parsed = JSON.parse(row.content);
        if (parsed.fontFamily) fonts.push(parsed.fontFamily);
      } catch {}
    }
  }
  return fonts;
}

/** Get all custom fonts used in field_styles for given entities */
export async function getEntityFonts(
  entityType: string,
  entityIds: string[]
): Promise<string[]> {
  if (entityIds.length === 0) return [];
  const rows = await db
    .select({ fontFamily: fieldStyles.fontFamily })
    .from(fieldStyles)
    .where(
      and(
        eq(fieldStyles.entityType, entityType),
        inArray(fieldStyles.entityId, entityIds)
      )
    );
  return rows.map((r) => r.fontFamily);
}

/** Get style for a specific field_styles entry */
export async function getFieldStyle(
  entityType: string,
  entityId: string,
  fieldName: string
): Promise<FieldStyle | null> {
  const [row] = await db
    .select()
    .from(fieldStyles)
    .where(
      and(
        eq(fieldStyles.entityType, entityType),
        eq(fieldStyles.entityId, entityId),
        eq(fieldStyles.fieldName, fieldName)
      )
    );
  if (!row) return null;
  return { fontFamily: row.fontFamily, fontSize: row.fontSize };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/fonts.ts
git commit -m "feat: add font utility functions"
```

### Task 4: Create field styles API

**Files:**
- Create: `src/app/api/field-styles/route.ts`
- Create: `src/app/api/fonts/route.ts`

- [ ] **Step 1: Create field styles API**

Create `src/app/api/field-styles/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fieldStyles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const fieldName = searchParams.get("fieldName");

  if (!entityType || !entityId || !fieldName) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(fieldStyles)
    .where(
      and(
        eq(fieldStyles.entityType, entityType),
        eq(fieldStyles.entityId, entityId),
        eq(fieldStyles.fieldName, fieldName)
      )
    );

  return NextResponse.json(row ?? null);
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { entityType, entityId, fieldName, fontFamily, fontSize } = await request.json();

  if (!entityType || !entityId || !fieldName || !fontFamily || !fontSize) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Upsert
  const [existing] = await db
    .select()
    .from(fieldStyles)
    .where(
      and(
        eq(fieldStyles.entityType, entityType),
        eq(fieldStyles.entityId, entityId),
        eq(fieldStyles.fieldName, fieldName)
      )
    );

  if (existing) {
    const [updated] = await db
      .update(fieldStyles)
      .set({ fontFamily, fontSize })
      .where(eq(fieldStyles.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(fieldStyles)
    .values({ entityType, entityId, fieldName, fontFamily, fontSize })
    .returning();
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { entityType, entityId, fieldName } = await request.json();

  await db
    .delete(fieldStyles)
    .where(
      and(
        eq(fieldStyles.entityType, entityType),
        eq(fieldStyles.entityId, entityId),
        eq(fieldStyles.fieldName, fieldName)
      )
    );

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create fonts catalog API**

Create `src/app/api/fonts/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fonts from "@/data/google-fonts.json";

export async function GET() {
  return NextResponse.json(fonts);
}
```

- [ ] **Step 3: Build to verify**

```bash
npx next build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/field-styles/route.ts src/app/api/fonts/route.ts
git commit -m "feat: add field-styles and fonts catalog API endpoints"
```

---

## Chunk 2: Toolbar Component

### Task 5: Create the TextStyleToolbar component

**Files:**
- Create: `src/components/admin/text-style-toolbar.tsx`

- [ ] **Step 1: Create the toolbar**

Create `src/components/admin/text-style-toolbar.tsx`:

```typescript
"use client";

import { useState, useEffect, useRef } from "react";

type FontEntry = { family: string; category: string };

type TextStyleToolbarProps = {
  fontFamily: string | null;
  fontSize: number | null;
  onChange: (style: { fontFamily: string | null; fontSize: number | null }) => void;
  onReset: () => void;
};

export function TextStyleToolbar({ fontFamily, fontSize, onChange, onReset }: TextStyleToolbarProps) {
  const [fonts, setFonts] = useState<FontEntry[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/fonts")
      .then((r) => r.json())
      .then(setFonts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function loadFont(family: string) {
    if (loadedFonts.has(family)) return;
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setLoadedFonts((prev) => new Set(prev).add(family));
  }

  function selectFont(family: string) {
    loadFont(family);
    onChange({ fontFamily: family, fontSize });
    setShowDropdown(false);
    setSearch("");
  }

  const filtered = search
    ? fonts.filter((f) => f.family.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : fonts.slice(0, 50);

  return (
    <div
      className="absolute -top-14 left-0 z-50 flex items-center gap-2 bg-white shadow-lg border border-surface-container px-3 py-2 rounded-sm"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Font picker */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 text-xs border border-outline-variant px-2 py-1 hover:border-primary transition-colors min-w-[140px] text-left truncate"
          style={fontFamily ? { fontFamily } : undefined}
        >
          {fontFamily || "varsayılan"}
          <span className="material-symbols-outlined text-sm ml-auto">expand_more</span>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-surface-container w-64 max-h-64 flex flex-col z-50">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="font ara..."
              className="w-full px-3 py-2 text-xs border-b border-surface-container outline-none"
              autoFocus
            />
            <div className="overflow-y-auto flex-1">
              <button
                onClick={() => {
                  onChange({ fontFamily: null, fontSize });
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-xs text-left hover:bg-surface-container-low text-on-surface-variant"
              >
                varsayılan
              </button>
              {filtered.map((font) => {
                // Load font on first render in viewport
                loadFont(font.family);
                return (
                  <button
                    key={font.family}
                    onClick={() => selectFont(font.family)}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-surface-container-low truncate ${
                      fontFamily === font.family ? "bg-primary/10 text-primary font-bold" : ""
                    }`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.family}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Size slider */}
      <div className="flex items-center gap-1">
        <input
          type="range"
          min={12}
          max={120}
          value={fontSize ?? 16}
          onChange={(e) => onChange({ fontFamily, fontSize: parseInt(e.target.value) })}
          className="w-20 h-1 accent-primary"
        />
        <span className="text-[10px] font-bold text-on-surface-variant w-8 text-center">
          {fontSize ?? "—"}
        </span>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
        title="Stili sıfırla"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
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
git add src/components/admin/text-style-toolbar.tsx
git commit -m "feat: add TextStyleToolbar component with font picker and size slider"
```

---

## Chunk 3: InlineEdit Integration

### Task 6: Add font styling to InlineEdit

**Files:**
- Modify: `src/components/admin/inline-edit.tsx`

- [ ] **Step 1: Rewrite InlineEdit with style support**

Replace the entire `src/components/admin/inline-edit.tsx` with:

```typescript
"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useState, useRef, useEffect } from "react";
import { showToast } from "./toast";
import { TextStyleToolbar } from "./text-style-toolbar";

type FieldStyle = { fontFamily: string | null; fontSize: number | null };

type InlineEditProps = {
  pageSlug: string;
  sectionKey: string;
  initialContent: string;
  initialStyle?: FieldStyle;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "blockquote" | "div";
  className?: string;
  multiline?: boolean;
};

export function InlineEdit({
  pageSlug,
  sectionKey,
  initialContent,
  initialStyle,
  as: Tag = "span",
  className = "",
  multiline = false,
}: InlineEditProps) {
  const { isEditing: editMode } = useAdmin();
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [style, setStyle] = useState<FieldStyle>(initialStyle ?? { fontFamily: null, fontSize: null });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  // Close toolbar on outside click
  useEffect(() => {
    if (!showToolbar) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
        saveStyle(style);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showToolbar, style]);

  const inlineStyle: React.CSSProperties = {};
  if (style.fontFamily) inlineStyle.fontFamily = style.fontFamily;
  if (style.fontSize) inlineStyle.fontSize = `${style.fontSize}px`;

  if (!editMode) return <Tag className={className} style={inlineStyle}>{content}</Tag>;

  if (editing) {
    const InputTag = multiline ? "textarea" : "input";
    return (
      <div ref={wrapperRef} className="relative">
        {showToolbar && (
          <TextStyleToolbar
            fontFamily={style.fontFamily}
            fontSize={style.fontSize}
            onChange={(s) => setStyle(s)}
            onReset={() => {
              setStyle({ fontFamily: null, fontSize: null });
              resetStyle();
              setShowToolbar(false);
            }}
          />
        )}
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
              setShowToolbar(false);
            }
          }}
          className={`${className} outline-2 outline-primary/50 outline-dashed bg-transparent w-full resize-none`}
          style={inlineStyle}
          rows={multiline ? 4 : undefined}
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      {showToolbar && (
        <TextStyleToolbar
          fontFamily={style.fontFamily}
          fontSize={style.fontSize}
          onChange={(s) => setStyle(s)}
          onReset={() => {
            setStyle({ fontFamily: null, fontSize: null });
            resetStyle();
            setShowToolbar(false);
          }}
        />
      )}
      <Tag
        className={`${className} cursor-pointer outline outline-1 outline-primary/30 hover:outline-2 hover:outline-primary/50 group relative`}
        style={inlineStyle}
        onClick={() => setEditing(true)}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowToolbar(!showToolbar);
        }}
      >
        {content}
        <span className="material-symbols-outlined absolute -top-2.5 -right-2.5 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-70 group-hover:opacity-100 transition-opacity">
          edit
        </span>
        <span
          className="material-symbols-outlined absolute -top-2.5 -left-2.5 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-0 group-hover:opacity-70 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setShowToolbar(!showToolbar);
          }}
        >
          format_size
        </span>
      </Tag>
    </div>
  );

  async function handleSave() {
    setShowToolbar(false);
    if (content !== initialContent) {
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
      }
    }
    setEditing(false);
    saveStyle(style);
  }

  async function saveStyle(s: FieldStyle) {
    if (!s.fontFamily && !s.fontSize) return;
    try {
      await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          sectionKey: `${sectionKey}_style`,
          content: JSON.stringify({ fontFamily: s.fontFamily, fontSize: s.fontSize }),
        }),
      });
    } catch {}
  }

  async function resetStyle() {
    try {
      await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          sectionKey: `${sectionKey}_style`,
          content: "{}",
        }),
      });
      showToast("stil sıfırlandı", "success");
    } catch {}
  }
}
```

**Key changes from original:**
- Added `initialStyle` prop for server-side style injection
- Added `showToolbar` state with `TextStyleToolbar`
- Right-click or `format_size` icon opens toolbar
- Inline `style` applied for custom font/size
- `saveStyle()` saves style JSON to `page_content` with `_style` suffix
- `resetStyle()` clears style by saving empty `{}`

- [ ] **Step 2: Build to verify**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/inline-edit.tsx
git commit -m "feat: add font picker and size slider to InlineEdit"
```

### Task 7: Pass initial styles to InlineEdit from server pages

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/galeri/page.tsx`
- Modify: `src/app/hakkinda/page.tsx`
- Modify: `src/app/iletisim/page.tsx`
- Modify: `src/app/ozel-istek/page.tsx`

Each page already fetches `page_content` rows. For style support, we need to:

1. Parse `_style` rows from the existing content fetch
2. Pass `initialStyle` to each `InlineEdit`
3. Add a Google Fonts `<link>` tag for any custom fonts

- [ ] **Step 1: Create a shared helper for parsing styles**

Add to `src/lib/fonts.ts`:

```typescript
/** Parse style rows from a page_content fetch result into a style map */
export function parseStyleMap(
  rows: { sectionKey: string; content: string }[]
): Record<string, FieldStyle> {
  const map: Record<string, FieldStyle> = {};
  for (const row of rows) {
    if (row.sectionKey.endsWith("_style")) {
      try {
        const parsed = JSON.parse(row.content);
        if (parsed.fontFamily || parsed.fontSize) {
          const baseKey = row.sectionKey.replace(/_style$/, "");
          map[baseKey] = {
            fontFamily: parsed.fontFamily || null,
            fontSize: parsed.fontSize || null,
          };
        }
      } catch {}
    }
  }
  return map;
}

/** Collect font families from a style map */
export function collectFonts(styleMap: Record<string, FieldStyle>): string[] {
  return Object.values(styleMap)
    .map((s) => s.fontFamily)
    .filter(Boolean) as string[];
}
```

- [ ] **Step 2: Update homepage (src/app/page.tsx)**

The homepage already fetches all `page_content` rows for "home". After building the `content` map, add:

```typescript
import { parseStyleMap, collectFonts, buildGoogleFontsUrl } from "@/lib/fonts";
```

After `for (const row of rows) { content[row.sectionKey] = row.content; }`:

```typescript
const styleMap = parseStyleMap(rows);
const fontsUrl = buildGoogleFontsUrl(collectFonts(styleMap));
```

In the JSX return, add before the main content (inside `<HomeClient>`):

```typescript
{fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
```

For each `<InlineEdit>`, add `initialStyle={styleMap["hero_title"]}` (matching the sectionKey). For example:

```typescript
<InlineEdit
  pageSlug="home"
  sectionKey="hero_title"
  initialContent={content.hero_title}
  initialStyle={styleMap["hero_title"]}
  as="h1"
  className="..."
/>
```

Repeat for all InlineEdit instances on the page: `hero_title`, `hero_subtitle`, `new_arrivals_title`, `new_arrivals_description`, `quote_text`, `quote_attribution`.

- [ ] **Step 3: Update galeri page (src/app/galeri/page.tsx)**

Same pattern. The page already fetches `pageContent` rows for "galeri". Add `parseStyleMap`/`collectFonts`/`buildGoogleFontsUrl` imports and logic. Pass `initialStyle` to `InlineEdit` instances (`quote_text`, `quote_attribution`). Add `<link>` tag.

- [ ] **Step 4: Update hakkinda page (src/app/hakkinda/page.tsx)**

Same pattern for all InlineEdit instances on the hakkinda page. Read the file first to identify all sectionKeys.

- [ ] **Step 5: Update iletisim page (src/app/iletisim/page.tsx)**

Same pattern.

- [ ] **Step 6: Update ozel-istek page (src/app/ozel-istek/page.tsx)**

Same pattern.

- [ ] **Step 7: Build to verify**

```bash
npx next build
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/fonts.ts src/app/page.tsx src/app/galeri/page.tsx src/app/hakkinda/page.tsx src/app/iletisim/page.tsx src/app/ozel-istek/page.tsx
git commit -m "feat: pass initial font styles to InlineEdit and preload Google Fonts"
```

---

## Chunk 4: Artwork/Collection Text Styling

### Task 8: Create StyleableText component

**Files:**
- Create: `src/components/admin/styleable-text.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/admin/styleable-text.tsx`:

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { TextStyleToolbar } from "./text-style-toolbar";
import { showToast } from "./toast";

type FieldStyle = { fontFamily: string | null; fontSize: number | null };

type StyleableTextProps = {
  entityType: "artwork" | "collection";
  entityId: string;
  fieldName: string;
  initialStyle?: FieldStyle | null;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  children: React.ReactNode;
};

export function StyleableText({
  entityType,
  entityId,
  fieldName,
  initialStyle,
  as: Tag = "span",
  className = "",
  children,
}: StyleableTextProps) {
  const { isEditing } = useAdmin();
  const [showToolbar, setShowToolbar] = useState(false);
  const [style, setStyle] = useState<FieldStyle>(
    initialStyle ?? { fontFamily: null, fontSize: null }
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showToolbar) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
        saveStyle(style);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showToolbar, style]);

  const inlineStyle: React.CSSProperties = {};
  if (style.fontFamily) inlineStyle.fontFamily = style.fontFamily;
  if (style.fontSize) inlineStyle.fontSize = `${style.fontSize}px`;

  if (!isEditing) {
    return <Tag className={className} style={inlineStyle}>{children}</Tag>;
  }

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {showToolbar && (
        <TextStyleToolbar
          fontFamily={style.fontFamily}
          fontSize={style.fontSize}
          onChange={(s) => setStyle(s)}
          onReset={() => {
            setStyle({ fontFamily: null, fontSize: null });
            resetStyle();
            setShowToolbar(false);
          }}
        />
      )}
      <Tag
        className={`${className} group/style relative`}
        style={inlineStyle}
      >
        {children}
        <span
          className="material-symbols-outlined absolute -top-2 -left-2 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-0 group-hover/style:opacity-70 hover:!opacity-100 transition-opacity cursor-pointer z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowToolbar(!showToolbar);
          }}
        >
          format_size
        </span>
      </Tag>
    </div>
  );

  async function saveStyle(s: FieldStyle) {
    if (!s.fontFamily && !s.fontSize) return;
    try {
      await fetch("/api/field-styles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          fieldName,
          fontFamily: s.fontFamily ?? "",
          fontSize: s.fontSize ?? 16,
        }),
      });
    } catch {}
  }

  async function resetStyle() {
    try {
      await fetch("/api/field-styles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, fieldName }),
      });
      showToast("stil sıfırlandı", "success");
    } catch {}
  }
}
```

- [ ] **Step 2: Build to verify**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/styleable-text.tsx
git commit -m "feat: add StyleableText component for artwork/collection text styling"
```

### Task 9: Integrate StyleableText into artwork and collection components

**Files:**
- Modify: `src/components/artwork/artwork-card.tsx`
- Modify: `src/app/eser/[slug]/artwork-detail-client.tsx`
- Modify: `src/components/collection/template-grid.tsx`
- Modify: `src/components/collection/template-showcase.tsx`
- Modify: `src/components/collection/template-challenge.tsx`

For each file: read the file, wrap artwork `title` and `description` text in `<StyleableText>` tags. Import `StyleableText` from `@/components/admin/styleable-text`.

- [ ] **Step 1: Update artwork-card.tsx**

Read the file. Wrap the title `<h3>` and description `<p>` inside the card:

```typescript
import { StyleableText } from "@/components/admin/styleable-text";
```

Replace the title h3:
```typescript
<StyleableText entityType="artwork" entityId={artwork.id} fieldName="title" as="h3" className="text-lg font-bold text-on-surface leading-tight">
  {artwork.title}
</StyleableText>
```

Replace the description p:
```typescript
<StyleableText entityType="artwork" entityId={artwork.id} fieldName="description" as="p" className="text-sm text-on-surface-variant">
  {artwork.description}
</StyleableText>
```

- [ ] **Step 2: Update artwork detail client**

Read `src/app/eser/[slug]/artwork-detail-client.tsx`. Wrap the title `<h1>` and description `<p>` with `StyleableText`.

- [ ] **Step 3: Update template-grid.tsx**

Read the file. Wrap artwork title and description with `StyleableText`.

- [ ] **Step 4: Update template-showcase.tsx**

Read the file. Wrap artwork titles and descriptions with `StyleableText`.

- [ ] **Step 5: Update template-challenge.tsx**

Read the file. Wrap artwork titles with `StyleableText`.

- [ ] **Step 6: Build to verify**

```bash
npx next build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/artwork/artwork-card.tsx src/app/eser/[slug]/artwork-detail-client.tsx src/components/collection/template-grid.tsx src/components/collection/template-showcase.tsx src/components/collection/template-challenge.tsx
git commit -m "feat: add font styling to artwork and collection text fields"
```

---

## Chunk 5: Font Preloading for Artwork/Collection Pages

### Task 10: Preload fonts on artwork and collection pages

**Files:**
- Modify: `src/app/eser/[slug]/page.tsx`
- Modify: `src/app/koleksiyon/[slug]/page.tsx`
- Modify: `src/app/koleksiyon/page.tsx`

- [ ] **Step 1: Preload fonts on artwork detail page**

In `src/app/eser/[slug]/page.tsx`, add imports:

```typescript
import { getEntityFonts, buildGoogleFontsUrl } from "@/lib/fonts";
```

After fetching the artwork and related, collect fonts:

```typescript
const allArtworkIds = [artwork.id, ...related.map((r) => r.id)];
const entityFonts = await getEntityFonts("artwork", allArtworkIds);
const fontsUrl = buildGoogleFontsUrl(entityFonts);
```

Add in the JSX before `<main>`:

```typescript
{fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
```

- [ ] **Step 2: Preload fonts on collection detail page**

In `src/app/koleksiyon/[slug]/page.tsx`, same pattern — collect artwork IDs from the collection, fetch entity fonts, add `<link>`.

- [ ] **Step 3: Preload fonts on collection listing page**

In `src/app/koleksiyon/page.tsx`, collect all artwork IDs from collection covers, fetch entity fonts, add `<link>`.

- [ ] **Step 4: Build to verify**

```bash
npx next build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/eser/[slug]/page.tsx src/app/koleksiyon/[slug]/page.tsx src/app/koleksiyon/page.tsx
git commit -m "feat: preload Google Fonts on artwork and collection pages"
```

---

## Chunk 6: Final Verification

### Task 11: Full build and smoke test

- [ ] **Step 1: Run full build**

```bash
npx next build
```

- [ ] **Step 2: Start dev server and verify**

```bash
npx next dev
```

Verify:
- Homepage: right-click or click format_size icon on hero title → toolbar appears with font picker + size slider
- Change font on hero title → text updates live, persists after page refresh
- Gallery page: same for quote text
- Artwork card: hover title in edit mode → format_size icon appears, click opens toolbar
- Artwork detail page: same for title/description
- Collection templates: same for artwork titles
- Visitor mode (logged out): custom fonts render correctly, no toolbar visible
- Reset button clears custom style back to default

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during font picker smoke testing"
```
