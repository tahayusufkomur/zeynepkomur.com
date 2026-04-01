import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { count } from "drizzle-orm";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const [{ total }] = await db.select({ total: count() }).from(newsletterSubscribers);
  return NextResponse.json({ count: total });
}
