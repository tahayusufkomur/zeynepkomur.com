export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks, artworkImages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, ne, sql } from "drizzle-orm";
import { deleteUpload } from "@/lib/upload";
import { attachImages } from "@/lib/db/artwork-with-images";
import { slugifyTitle } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
  if (!artwork) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [result] = await attachImages([artwork]);
  return NextResponse.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  // Separate images from artwork fields
  const { images, ...artworkFields } = body;

  if (artworkFields.title) {
    let slug = slugifyTitle(artworkFields.title) || "eser";
    const existing = await db
      .select({ slug: artworks.slug })
      .from(artworks)
      .where(ne(artworks.id, id));
    const taken = new Set(existing.map((r) => r.slug));
    const base = slug;
    let i = 1;
    while (taken.has(slug)) {
      slug = `${base}-${i++}`;
    }
    artworkFields.slug = slug;
  }

  const [updated] = await db
    .update(artworks)
    .set({ ...artworkFields, updatedAt: sql`(datetime('now'))` })
    .where(eq(artworks.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If images array was provided, sync artwork_images
  if (Array.isArray(images)) {
    // Get existing images to clean up deleted files
    const existingImages = await db
      .select()
      .from(artworkImages)
      .where(eq(artworkImages.artworkId, id));

    const newPaths = new Set(images.map((img: { imagePath: string }) => img.imagePath));
    for (const existing of existingImages) {
      if (!newPaths.has(existing.imagePath)) {
        await deleteUpload(existing.imagePath);
      }
    }

    // Replace all images
    await db.delete(artworkImages).where(eq(artworkImages.artworkId, id));
    if (images.length > 0) {
      await db.insert(artworkImages).values(
        images.map((img: { imagePath: string }, i: number) => ({
          artworkId: id,
          imagePath: img.imagePath,
          sortOrder: i,
        }))
      );
    }
  }

  const [result] = await attachImages([updated]);
  return NextResponse.json(result);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
  if (!artwork) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete all image files (cover + additional)
  const additionalImages = await db
    .select()
    .from(artworkImages)
    .where(eq(artworkImages.artworkId, id));

  await deleteUpload(artwork.imagePath);
  for (const img of additionalImages) {
    await deleteUpload(img.imagePath);
  }

  // Cascade delete handles artwork_images rows
  await db.delete(artworks).where(eq(artworks.id, id));
  return NextResponse.json({ success: true });
}
