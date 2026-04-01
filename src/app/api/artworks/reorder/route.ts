export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body: { id: string; sortOrder: number }[] = await request.json();
  for (const item of body) {
    await db.update(artworks).set({ sortOrder: item.sortOrder }).where(eq(artworks.id, item.id));
  }
  return NextResponse.json({ success: true });
}
