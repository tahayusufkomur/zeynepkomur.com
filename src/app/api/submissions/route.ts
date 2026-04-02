export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formSubmissions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { sendFormNotification } from "@/lib/email";
import { desc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const results = await db.select().from(formSubmissions).orderBy(desc(formSubmissions.createdAt));
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bir dakika bekleyin." }, { status: 429 });
  }

  const body = await request.json();
  const { formType, data } = body;

  if (data._honey) {
    return NextResponse.json({ success: true });
  }

  if (!["contact", "custom_request", "question"].includes(formType)) {
    return NextResponse.json({ error: "Geçersiz form türü" }, { status: 400 });
  }

  const validationError = validateFormData(formType, data);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const [submission] = await db.insert(formSubmissions).values({
    formType,
    data: JSON.stringify(data),
  }).returning();

  sendFormNotification({ formType, data });

  return NextResponse.json(submission, { status: 201 });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFormData(formType: string, data: Record<string, string>): string | null {
  if (!data.email || !emailRegex.test(data.email)) return "Geçersiz e-posta adresi";

  switch (formType) {
    case "contact":
      if (!data.name || data.name.length > 100) return "İsim gerekli (max 100 karakter)";
      if (!data.description || data.description.length > 2000) return "Açıklama gerekli (max 2000 karakter)";
      break;
    case "question":
      if (!data.question || data.question.length > 2000) return "Soru gerekli (max 2000 karakter)";
      break;
    case "custom_request":
      if (!data.firstName || data.firstName.length > 50) return "Ad gerekli (max 50 karakter)";
      if (data.lastName && data.lastName.length > 50) return "Soyad max 50 karakter";
      if (!data.description || data.description.length > 2000) return "Açıklama gerekli (max 2000 karakter)";
      break;
  }
  return null;
}
