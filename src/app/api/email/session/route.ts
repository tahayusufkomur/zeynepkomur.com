export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { createSession } from "@/lib/mailcraft";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const session = await createSession(origin);
    return NextResponse.json({ sessionToken: session.token });
  } catch (error) {
    console.error("[email/session] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}
