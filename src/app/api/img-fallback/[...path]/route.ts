export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const PUBLIC_ROOT = path.join(process.cwd(), "public");

const MIME: Record<string, string> = {
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;
  const requested = parts.join("/");

  // Refuse traversal attempts
  if (requested.includes("..") || requested.includes("\0")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Only handle the /uploads/* namespace
  if (!requested.startsWith("uploads/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  // First try the requested file as-is (covers cases where Caddy missed but
  // the file did get written to public/ — e.g. local dev without Caddy).
  const requestedFull = path.join(PUBLIC_ROOT, requested);
  if (await fileExists(requestedFull)) {
    return serve(requestedFull);
  }

  // Fallback: if it ends in .avif, look for the original backup the upload
  // pipeline wrote alongside ({id}.avif → {id}-original.{jpg|jpeg|png|webp}).
  if (requested.endsWith(".avif")) {
    const base = requested.slice(0, -".avif".length);
    for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
      const candidate = path.join(PUBLIC_ROOT, `${base}-original${ext}`);
      if (await fileExists(candidate)) {
        return serve(candidate);
      }
    }
  }

  return new NextResponse("Not found", { status: 404 });
}

async function serve(filePath: string): Promise<NextResponse> {
  const data = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const body = new Uint8Array(data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
