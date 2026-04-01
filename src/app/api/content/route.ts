import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageContent } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const section = searchParams.get("section");

  if (!page) return NextResponse.json({ error: "page parameter required" }, { status: 400 });

  const conditions = section
    ? and(eq(pageContent.pageSlug, page), eq(pageContent.sectionKey, section))
    : eq(pageContent.pageSlug, page);

  const results = await db.select().from(pageContent).where(conditions);
  return NextResponse.json(results);
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const { pageSlug, sectionKey, content } = body;

  const [updated] = await db
    .update(pageContent)
    .set({ content, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(pageContent.pageSlug, pageSlug), eq(pageContent.sectionKey, sectionKey)))
    .returning();

  if (!updated) {
    const [created] = await db.insert(pageContent).values({ pageSlug, sectionKey, content }).returning();
    return NextResponse.json(created);
  }

  return NextResponse.json(updated);
}
