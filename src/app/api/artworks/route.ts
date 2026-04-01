import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { asc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const results = category
    ? await db.select().from(artworks).where(eq(artworks.category, category as "resim" | "dekorasyon" | "posterler")).orderBy(asc(artworks.sortOrder))
    : await db.select().from(artworks).orderBy(asc(artworks.sortOrder));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const [artwork] = await db.insert(artworks).values({
    title: body.title,
    description: body.description,
    category: body.category,
    dimensions: body.dimensions || "",
    technique: body.technique || "",
    year: body.year || null,
    availability: body.availability || "available",
    imagePath: body.imagePath,
    sortOrder: body.sortOrder || 0,
  }).returning();

  return NextResponse.json(artwork, { status: 201 });
}
