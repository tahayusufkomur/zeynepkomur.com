/**
 * Seeds artworks, collections, collection-artwork links, and homepage hero
 * from the converted media into the database.
 * Run after convert-media.ts.
 *
 * Usage: npx tsx scripts/seed-artworks.ts
 */

import { readFileSync } from "fs";
import path from "path";
import Database from "better-sqlite3";

const SEED_FILE = path.join(process.cwd(), "scripts", "artwork-seed.json");
const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "./data/zeyneple.db";

const TURKISH_MAP: Record<string, string> = {
  ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
  ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
};

function slugify(title: string): string {
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

type ArtworkSeed = {
  title: string;
  collection: string;
  imagePath: string;
  additionalImages?: string[];
  originalFile: string;
};

function main() {
  const artworks: ArtworkSeed[] = JSON.parse(readFileSync(SEED_FILE, "utf-8"));
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");

  // --- 1. Create collections from unique collection names ---
  const collectionNames = [...new Set(artworks.map((a) => a.collection))];
  const collectionIdMap = new Map<string, string>();

  const insertCollection = db.prepare(`
    INSERT OR IGNORE INTO collections (id, title, slug, description, template_type, metadata, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '{}', 1, datetime('now'), datetime('now'))
  `);

  for (const name of collectionNames) {
    const id = crypto.randomUUID();
    const slug = slugify(name);
    insertCollection.run(id, name, slug, "", "grid");
    collectionIdMap.set(name, id);
  }

  // Resolve actual IDs (in case some already existed via OR IGNORE)
  const existingCollections = db.prepare("SELECT id, title FROM collections").all() as { id: string; title: string }[];
  for (const c of existingCollections) {
    collectionIdMap.set(c.title, c.id);
  }

  console.log(`✓ Created ${collectionNames.length} collections`);

  // --- 2. Insert artworks with slugs ---
  const insertArtwork = db.prepare(`
    INSERT OR IGNORE INTO artworks (id, title, description, category, dimensions, technique, year, availability, image_path, slug, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const insertImage = db.prepare(`
    INSERT OR IGNORE INTO artwork_images (id, artwork_id, image_path, sort_order, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  const insertCollectionArtwork = db.prepare(`
    INSERT OR IGNORE INTO collection_artworks (collection_id, artwork_id, sort_order)
    VALUES (?, ?, ?)
  `);

  // Track slugs to ensure uniqueness
  const usedSlugs = new Set<string>();
  const artworkIds: string[] = [];

  // Track per-collection sort order
  const collectionSortCounters = new Map<string, number>();

  let artworkCount = 0;
  let imageCount = 0;
  let linkCount = 0;

  for (let i = 0; i < artworks.length; i++) {
    const a = artworks[i];
    const id = crypto.randomUUID();
    artworkIds.push(id);

    // Generate unique slug
    let slug = slugify(a.title);
    if (!slug) slug = `eser-${i}`;
    let finalSlug = slug;
    let suffix = 2;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(finalSlug);

    insertArtwork.run(
      id,
      a.title,
      `koleksiyon: ${a.collection}`,
      "resim",
      "",
      "",
      2024,
      "available",
      a.imagePath,
      finalSlug,
      i
    );
    artworkCount++;

    // Insert additional images
    if (a.additionalImages) {
      for (let j = 0; j < a.additionalImages.length; j++) {
        const imgId = crypto.randomUUID();
        insertImage.run(imgId, id, a.additionalImages[j], j);
        imageCount++;
      }
    }

    // --- 3. Link artwork to its collection ---
    const collectionId = collectionIdMap.get(a.collection);
    if (collectionId) {
      const sortOrder = collectionSortCounters.get(a.collection) ?? 0;
      insertCollectionArtwork.run(collectionId, id, sortOrder);
      collectionSortCounters.set(a.collection, sortOrder + 1);
      linkCount++;
    }
  }

  console.log(`✓ Seeded ${artworkCount} artworks with ${imageCount} additional images`);
  console.log(`✓ Created ${linkCount} collection-artwork links`);

  // --- 4. Set homepage hero artworks (first 3) ---
  if (artworkIds.length >= 3) {
    const heroIds = JSON.stringify(artworkIds.slice(0, 3));
    const upsertHero = db.prepare(`
      INSERT INTO page_content (id, page_slug, section_key, content, updated_at)
      VALUES (?, 'home', 'hero_artworks', ?, datetime('now'))
      ON CONFLICT(page_slug, section_key) DO UPDATE SET content = excluded.content, updated_at = datetime('now')
    `);
    upsertHero.run(crypto.randomUUID(), heroIds);
    console.log(`✓ Set homepage hero artworks (first 3)`);
  }

  db.close();
  console.log("\nDone! Run 'make dev' to see the results.");
}

main();
