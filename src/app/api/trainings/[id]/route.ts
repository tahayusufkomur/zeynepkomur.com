export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trainings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const [row] = await db.select().from(trainings).where(eq(trainings.id, id));
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(trainings)
    .set({
      title: body.title,
      content: body.content ?? "",
      duration: body.duration ?? "",
      price: body.price ?? "",
      format: body.format ?? "",
      imagePath: body.imagePath ?? "",
      isPublished: body.isPublished ?? true,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(trainings.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  await db.delete(trainings).where(eq(trainings.id, id));
  return NextResponse.json({ ok: true });
}
