import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { processUpload, UploadCategory } from "@/lib/upload";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as UploadCategory) || "artworks";

  // "forms" category uploads allowed without auth (custom request form)
  if (category !== "forms") {
    const authError = await requireAdmin();
    if (authError) return authError;
  }

  if (!file) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }

  const result = await processUpload(file, category);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ path: result.path });
}
