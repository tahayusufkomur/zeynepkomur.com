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

  // Snapshot the current row BEFORE updating so we can compare cover paths
  // and clean up the previous cover file if it changed.
  const [previous] = await db.select().from(artworks).where(eq(artworks.id, id));

  const [updated] = await db
    .update(artworks)
    .set({ ...artworkFields, updatedAt: sql`(datetime('now'))` })
    .where(eq(artworks.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Files we MUST keep on disk after this PUT, regardless of which
  // table they appear in: the (new) cover + every additional image.
  // Including the cover here is critical — without it, "promote to cover"
  // would mark the new cover for deletion (it used to live in artwork_images,
  // not in newPaths) and silently nuke the file the row now points to.
  const protectedPaths = new Set<string>();
  if (updated.imagePath) protectedPaths.add(updated.imagePath);
  if (Array.isArray(images)) {
    for (const img of images as { imagePath: string }[]) {
      if (img?.imagePath) protectedPaths.add(img.imagePath);
    }
  }

  // If images array was provided, sync artwork_images
  if (Array.isArray(images)) {
    const existingImages = await db
      .select()
      .from(artworkImages)
      .where(eq(artworkImages.artworkId, id));

    for (const existing of existingImages) {
      if (!protectedPaths.has(existing.imagePath)) {
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

  // If the cover changed, the previous cover file becomes an orphan unless
  // it's now (or still) referenced as an additional image — in which case
  // it lives in protectedPaths.
  if (previous && previous.imagePath && previous.imagePath !== updated.imagePath) {
    if (!protectedPaths.has(previous.imagePath)) {
      await deleteUpload(previous.imagePath);
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
