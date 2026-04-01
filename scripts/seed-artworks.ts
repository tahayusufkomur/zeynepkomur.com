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
  originalFile: string;
};

function main() {
  const artworks: ArtworkSeed[] = JSON.parse(readFileSync(SEED_FILE, "utf-8"));
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");

  const insert = db.prepare(`
    INSERT OR IGNORE INTO artworks (id, title, description, category, dimensions, technique, year, availability, image_path, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  let count = 0;
  for (let i = 0; i < artworks.length; i++) {
    const a = artworks[i];
    const id = crypto.randomUUID();
    insert.run(
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
    count++;
  }

  console.log(`✓ Seeded ${count} artworks into database`);
  db.close();
}

main();
