import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { slugifyTitle } from "../utils";

export function migrate() {
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/zeyneple.db";
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS artworks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('resim', 'dekorasyon', 'posterler')),
      dimensions TEXT NOT NULL DEFAULT '',
      technique TEXT NOT NULL DEFAULT '',
      year INTEGER,
      availability TEXT NOT NULL DEFAULT 'available' CHECK(availability IN ('available', 'sold', 'contact')),
      image_path TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS page_content (
      id TEXT PRIMARY KEY,
      page_slug TEXT NOT NULL,
      section_key TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS page_content_unique ON page_content(page_slug, section_key);

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      template_type TEXT NOT NULL CHECK(template_type IN ('grid', 'showcase', 'challenge')),
      metadata TEXT NOT NULL DEFAULT '{}',
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collection_artworks (
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      day_number INTEGER,
      PRIMARY KEY (collection_id, artwork_id)
    );

    CREATE TABLE IF NOT EXISTS artwork_images (
      id TEXT PRIMARY KEY,
      artwork_id TEXT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
      image_path TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY,
      form_type TEXT NOT NULL CHECK(form_type IN ('contact', 'custom_request', 'question')),
      data TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_campaigns (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      template_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      recipient_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL DEFAULT 0,
      recipients TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sending' CHECK(status IN ('sending', 'sent', 'partial', 'failed')),
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add slug column to artworks (idempotent)
  const columns = sqlite.pragma("table_info(artworks)") as { name: string }[];
  if (!columns.some((c) => c.name === "slug")) {
    sqlite.exec(`ALTER TABLE artworks ADD COLUMN slug TEXT DEFAULT ''`);
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
    sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS artworks_slug_unique ON artworks(slug)`);
  }

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

  sqlite.close();
  console.log("[migrate] Tables created/verified");
}
