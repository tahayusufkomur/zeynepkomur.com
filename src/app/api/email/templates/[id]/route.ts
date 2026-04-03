export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { getTemplate, updateTemplate, deleteTemplate } from "@/lib/mailcraft";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const template = await getTemplate(id);
    return NextResponse.json(template);
  } catch (error) {
    console.error("[email/templates] Get error:", error);
    return NextResponse.json(
      { error: "Şablon bulunamadı" },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { name, json_data } = await request.json();
    const result = await updateTemplate(id, name, json_data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[email/templates] Update error:", error);
    return NextResponse.json(
      { error: "Şablon güncellenemedi" },
      { status: 502 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    await deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[email/templates] Delete error:", error);
    return NextResponse.json(
      { error: "Şablon silinemedi" },
      { status: 502 }
    );
  }
}
