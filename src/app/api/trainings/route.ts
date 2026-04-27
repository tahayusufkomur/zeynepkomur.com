export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trainings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { asc } from "drizzle-orm";
import { slugifyTitle } from "@/lib/utils";

export async function GET() {
  const rows = await db.select().from(trainings).orderBy(asc(trainings.sortOrder));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();

  let slug = slugifyTitle(body.title || "") || "egitim";
  const existing = await db.select({ slug: trainings.slug }).from(trainings);
  const taken = new Set(existing.map((r) => r.slug));
  const base = slug;
  let i = 1;
  while (taken.has(slug)) {
    slug = `${base}-${i++}`;
  }

  const [training] = await db
    .insert(trainings)
    .values({
      title: body.title ?? "",
      slug,
      content: body.content ?? "",
      duration: body.duration ?? "",
      price: body.price ?? "",
      format: body.format ?? "",
      imagePath: body.imagePath ?? "",
      isPublished: body.isPublished ?? true,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(training, { status: 201 });
}
