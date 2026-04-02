export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { renderTemplate } from "@/lib/mailcraft";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { templateId, variables } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: "templateId gerekli" }, { status: 400 });
    }

    const result = await renderTemplate(templateId, variables || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error("[email/render] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}
