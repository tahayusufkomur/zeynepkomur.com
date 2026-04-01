import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, sql } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  if (body.metadata && typeof body.metadata === "object") {
    body.metadata = JSON.stringify(body.metadata);
  }

  const [updated] = await db
    .update(collections)
    .set({ ...body, updatedAt: sql`(datetime('now'))` })
    .where(eq(collections.id, id))
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
  await db.delete(collections).where(eq(collections.id, id));
  return NextResponse.json({ success: true });
}
