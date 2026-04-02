import { db } from "./index";
import { artworks, artworkImages } from "./schema";
import { eq, inArray, asc } from "drizzle-orm";

type ArtworkImage = { id: string; imagePath: string; sortOrder: number };

/** Attach images array to a list of raw artwork rows. */
export async function attachImages<T extends { id: string }>(
  rows: T[]
): Promise<(T & { images: ArtworkImage[] })[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const allImages = await db
    .select({
      id: artworkImages.id,
      artworkId: artworkImages.artworkId,
      imagePath: artworkImages.imagePath,
      sortOrder: artworkImages.sortOrder,
    })
    .from(artworkImages)
    .where(inArray(artworkImages.artworkId, ids))
    .orderBy(asc(artworkImages.sortOrder));

  const imagesByArtwork = new Map<string, ArtworkImage[]>();
  for (const img of allImages) {
    const list = imagesByArtwork.get(img.artworkId) ?? [];
    list.push({ id: img.id, imagePath: img.imagePath, sortOrder: img.sortOrder });
    imagesByArtwork.set(img.artworkId, list);
  }

  return rows.map((row) => ({
    ...row,
    images: imagesByArtwork.get(row.id) ?? [],
  }));
}
