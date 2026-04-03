export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageContent, artworks } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { and, eq, inArray, sql } from "drizzle-orm";

export async function GET() {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(and(eq(pageContent.pageSlug, "home"), eq(pageContent.sectionKey, "hero_artworks")));
  if (!row) return NextResponse.json({ artworkIds: [] });
  try {
    return NextResponse.json({ artworkIds: JSON.parse(row.content) });
  } catch {
    return NextResponse.json({ artworkIds: [] });
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { artworkIds } = await request.json();
  if (!Array.isArray(artworkIds) || artworkIds.length !== 3) {
    return NextResponse.json({ error: "Exactly 3 artwork IDs required" }, { status: 400 });
  }

  const found = await db.select({ id: artworks.id }).from(artworks).where(inArray(artworks.id, artworkIds));
  if (found.length !== 3) {
    return NextResponse.json({ error: "One or more artwork IDs not found" }, { status: 400 });
  }

  const content = JSON.stringify(artworkIds);
  const existing = await db
    .select()
    .from(pageContent)
    .where(and(eq(pageContent.pageSlug, "home"), eq(pageContent.sectionKey, "hero_artworks")));

  if (existing.length > 0) {
    await db.update(pageContent).set({ content, updatedAt: sql`(datetime('now'))` }).where(eq(pageContent.id, existing[0].id));
  } else {
    await db.insert(pageContent).values({ pageSlug: "home", sectionKey: "hero_artworks", content });
  }

  return NextResponse.json({ success: true });
}
