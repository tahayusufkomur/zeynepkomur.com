export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { listTemplates, createTemplate } from "@/lib/mailcraft";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const templates = await listTemplates();

    const result = templates.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category || null,
      json_data: t.json_data || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[email/templates] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { name, json_data } = await request.json();
    if (!name || !json_data) {
      return NextResponse.json({ error: "name ve json_data gerekli" }, { status: 400 });
    }
    const result = await createTemplate(name, json_data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[email/templates] Create error:", error);
    return NextResponse.json(
      { error: "Şablon oluşturulamadı" },
      { status: 502 }
    );
  }
}
