import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formSubmissions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(formSubmissions)
    .set({ isRead: body.isRead ?? true })
    .where(eq(formSubmissions.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
