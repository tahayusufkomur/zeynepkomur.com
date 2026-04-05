export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fieldStyles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const fieldName = searchParams.get("fieldName");
  if (!entityType || !entityId || !fieldName) return NextResponse.json({ error: "Missing parameters" }, { status: 400 });

  const [row] = await db.select().from(fieldStyles).where(and(eq(fieldStyles.entityType, entityType), eq(fieldStyles.entityId, entityId), eq(fieldStyles.fieldName, fieldName)));
  return NextResponse.json(row ?? null);
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { entityType, entityId, fieldName, fontFamily, fontSize, color } = await request.json();
  if (!entityType || !entityId || !fieldName) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const [existing] = await db.select().from(fieldStyles).where(and(eq(fieldStyles.entityType, entityType), eq(fieldStyles.entityId, entityId), eq(fieldStyles.fieldName, fieldName)));
  if (existing) {
    const [updated] = await db.update(fieldStyles).set({ fontFamily: fontFamily ?? "", fontSize: fontSize ?? 16, color: color ?? null }).where(eq(fieldStyles.id, existing.id)).returning();
    return NextResponse.json(updated);
  }
  const [created] = await db.insert(fieldStyles).values({ entityType, entityId, fieldName, fontFamily: fontFamily ?? "", fontSize: fontSize ?? 16, color: color ?? null }).returning();
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const { entityType, entityId, fieldName } = await request.json();
  await db.delete(fieldStyles).where(and(eq(fieldStyles.entityType, entityType), eq(fieldStyles.entityId, entityId), eq(fieldStyles.fieldName, fieldName)));
  return NextResponse.json({ success: true });
}
