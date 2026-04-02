export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { sendWelcomeEmail } from "@/lib/email";
import { desc } from "drizzle-orm";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const results = await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const body = await request.json();
  const { email, name } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
  }

  try {
    await db.insert(newsletterSubscribers).values({ email, name: name || null });
    sendWelcomeEmail(email, name);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "zaten kayıtlısınız" }, { status: 409 });
    }
    throw e;
  }
}
