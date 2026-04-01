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
