export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks, artworkImages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { asc, eq } from "drizzle-orm";
import { attachImages } from "@/lib/db/artwork-with-images";
import { slugifyTitle } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const rows = category
    ? await db.select().from(artworks).where(eq(artworks.category, category as "resim" | "dekorasyon" | "posterler")).orderBy(asc(artworks.sortOrder))
    : await db.select().from(artworks).orderBy(asc(artworks.sortOrder));

  const results = await attachImages(rows);
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();

  let slug = slugifyTitle(body.title) || "eser";
  const existing = await db.select({ slug: artworks.slug }).from(artworks);
  const taken = new Set(existing.map((r) => r.slug));
  const base = slug;
  let i = 1;
  while (taken.has(slug)) {
    slug = `${base}-${i++}`;
  }

  const [artwork] = await db.insert(artworks).values({
    title: body.title,
    description: body.description,
    category: body.category,
    dimensions: body.dimensions || "",
    technique: body.technique || "",
    year: body.year || null,
    availability: body.availability || "available",
    imagePath: body.imagePath,
    slug,
    sortOrder: body.sortOrder || 0,
  }).returning();

  // Insert additional images
  const additionalImages: { imagePath: string }[] = body.images ?? [];
  if (additionalImages.length > 0) {
    await db.insert(artworkImages).values(
      additionalImages.map((img, i) => ({
        artworkId: artwork.id,
        imagePath: img.imagePath,
        sortOrder: i,
      }))
    );
  }

  const [result] = await attachImages([artwork]);
  return NextResponse.json(result, { status: 201 });
}
