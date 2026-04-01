import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, sql } from "drizzle-orm";
import { deleteUpload } from "@/lib/upload";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
  if (!artwork) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(artwork);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(artworks)
    .set({ ...body, updatedAt: sql`(datetime('now'))` })
    .where(eq(artworks.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
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

  await deleteUpload(artwork.imagePath);
  await db.delete(artworks).where(eq(artworks.id, id));
  return NextResponse.json({ success: true });
}
