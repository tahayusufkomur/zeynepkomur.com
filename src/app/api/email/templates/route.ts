export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { listTemplates, listGallery } from "@/lib/mailcraft";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [templates, gallery] = await Promise.all([
      listTemplates(),
      listGallery(),
    ]);

    const saved = templates.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category || null,
      isGallery: false,
    }));

    const galleryItems = gallery.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category || null,
      isGallery: true,
    }));

    return NextResponse.json([...saved, ...galleryItems]);
  } catch (error) {
    console.error("[email/templates] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}
