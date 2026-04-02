/**
 * Seeds artworks from the converted media into the database.
 * Run after convert-media.ts.
 *
 * Usage: npx tsx scripts/seed-artworks.ts
 */

import { readFileSync } from "fs";
import path from "path";
import Database from "better-sqlite3";

const SEED_FILE = path.join(process.cwd(), "scripts", "artwork-seed.json");
const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "./data/zeyneple.db";

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

  const insertArtwork = db.prepare(`
    INSERT OR IGNORE INTO artworks (id, title, description, category, dimensions, technique, year, availability, image_path, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const insertImage = db.prepare(`
    INSERT OR IGNORE INTO artwork_images (id, artwork_id, image_path, sort_order, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);

  let artworkCount = 0;
  let imageCount = 0;

  for (let i = 0; i < artworks.length; i++) {
    const a = artworks[i];
    const id = crypto.randomUUID();
    insertArtwork.run(
      id,
      a.title,
      `koleksiyon: ${a.collection}`,
      "resim",        // default category
      "",             // dimensions
      "",             // technique
      2024,           // year
      "available",
      a.imagePath,
      i               // sort order
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
  }

  console.log(`✓ Seeded ${artworkCount} artworks with ${imageCount} additional images into database`);
  db.close();
}

main();
