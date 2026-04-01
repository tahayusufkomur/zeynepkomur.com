import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  const isAdmin = !!session?.user;

  const results = isAdmin
    ? await db.select().from(collections).orderBy(asc(collections.createdAt))
    : await db.select().from(collections).where(eq(collections.isPublished, true)).orderBy(asc(collections.createdAt));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const [collection] = await db.insert(collections).values({
    title: body.title,
    slug: body.slug,
    description: body.description || "",
    templateType: body.templateType,
    metadata: JSON.stringify(body.metadata || {}),
    isPublished: body.isPublished || false,
  }).returning();

  return NextResponse.json(collection, { status: 201 });
}
