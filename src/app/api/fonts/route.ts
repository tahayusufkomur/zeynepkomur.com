export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import fonts from "@/data/google-fonts.json";

export async function GET() {
  return NextResponse.json(fonts);
}
