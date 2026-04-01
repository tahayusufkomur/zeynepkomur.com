export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collectionArtworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body: { artworkId: string; sortOrder: number; dayNumber?: number }[] = await request.json();

  await db.delete(collectionArtworks).where(eq(collectionArtworks.collectionId, id));

  if (body.length > 0) {
    await db.insert(collectionArtworks).values(
      body.map((item) => ({
        collectionId: id,
        artworkId: item.artworkId,
        sortOrder: item.sortOrder,
        dayNumber: item.dayNumber || null,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
