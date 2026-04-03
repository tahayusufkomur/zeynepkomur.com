export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { getTemplatePreview } from "@/lib/mailcraft";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const result = await getTemplatePreview(id);
    return new NextResponse(result.html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("[email/templates/preview] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}
