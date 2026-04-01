/**
 * Converts all images in media/photos/ to optimized AVIF files in public/uploads/artworks/
 * Creates a seed JSON file for importing into the database.
 *
 * Usage: npx tsx scripts/convert-media.ts
 */

import sharp from "sharp";
import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const MEDIA_DIR = path.join(process.cwd(), "media", "photos");
const OUTPUT_DIR = path.join(process.cwd(), "public", "uploads", "artworks");
const SEED_FILE = path.join(process.cwd(), "scripts", "artwork-seed.json");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_WIDTH = 2000;
const AVIF_QUALITY = 65;

type ArtworkSeed = {
  title: string;
  collection: string;
  imagePath: string;
  originalFile: string;
};

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const collections = readdirSync(MEDIA_DIR).filter((f) =>
    statSync(path.join(MEDIA_DIR, f)).isDirectory()
  );

  const artworks: ArtworkSeed[] = [];
  let totalOriginal = 0;
  let totalConverted = 0;

  for (const collection of collections) {
    const collectionDir = path.join(MEDIA_DIR, collection);
    const files = readdirSync(collectionDir).filter((f) =>
      IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    console.log(`\n📁 ${collection} (${files.length} images)`);

    for (const file of files) {
      const inputPath = path.join(collectionDir, file);
      const originalSize = statSync(inputPath).size;
      totalOriginal += originalSize;

      // Generate clean filename: collection-slug_original-name.avif
      const slug = collection
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-ıöüçşğ]/g, "");
      const baseName = path.basename(file, path.extname(file))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");
      const outputName = `${slug}_${baseName}.avif`;
      const outputPath = path.join(OUTPUT_DIR, outputName);

      try {
        const info = await sharp(inputPath)
          .resize(MAX_WIDTH, MAX_WIDTH, { fit: "inside", withoutEnlargement: true })
          .avif({ quality: AVIF_QUALITY })
          .toFile(outputPath);

        const newSize = statSync(outputPath).size;
        totalConverted += newSize;
        const ratio = ((1 - newSize / originalSize) * 100).toFixed(0);

        console.log(
          `  ✓ ${file} → ${outputName} (${formatSize(originalSize)} → ${formatSize(newSize)}, -${ratio}%)`
        );

        artworks.push({
          title: baseName.replace(/-/g, " "),
          collection,
          imagePath: `/uploads/artworks/${outputName}`,
          originalFile: file,
        });
      } catch (err) {
        console.error(`  ✗ ${file}: ${err}`);
      }
    }
  }

  writeFileSync(SEED_FILE, JSON.stringify(artworks, null, 2));

  console.log(`\n--- Summary ---`);
  console.log(`Images: ${artworks.length}`);
  console.log(`Original: ${formatSize(totalOriginal)}`);
  console.log(`AVIF: ${formatSize(totalConverted)}`);
  console.log(`Savings: ${((1 - totalConverted / totalOriginal) * 100).toFixed(0)}%`);
  console.log(`Seed file: ${SEED_FILE}`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

main().catch(console.error);
