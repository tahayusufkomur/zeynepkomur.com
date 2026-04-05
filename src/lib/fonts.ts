import { db } from "@/lib/db";
import { pageContent, fieldStyles } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export type FieldStyle = {
  fontFamily: string | null;
  fontSize: number | null;
  color: string | null;
};

export function buildGoogleFontsUrl(families: string[]): string | null {
  const unique = [...new Set(families)];
  if (unique.length === 0) return null;
  const params = unique.map((f) => `family=${encodeURIComponent(f)}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&subset=latin,latin-ext&display=swap`;
}

export async function getPageFonts(pageSlug: string): Promise<string[]> {
  const rows = await db
    .select({ content: pageContent.content })
    .from(pageContent)
    .where(eq(pageContent.pageSlug, pageSlug));

  const fonts: string[] = [];
  for (const row of rows) {
    if (row.content.startsWith("{")) {
      try {
        const parsed = JSON.parse(row.content);
        if (parsed.fontFamily) fonts.push(parsed.fontFamily);
      } catch {}
    }
  }
  return fonts;
}

export async function getEntityFonts(entityType: string, entityIds: string[]): Promise<string[]> {
  if (entityIds.length === 0) return [];
  const rows = await db
    .select({ fontFamily: fieldStyles.fontFamily })
    .from(fieldStyles)
    .where(and(eq(fieldStyles.entityType, entityType), inArray(fieldStyles.entityId, entityIds)));
  return rows.map((r) => r.fontFamily);
}

export async function getFieldStyle(entityType: string, entityId: string, fieldName: string): Promise<FieldStyle | null> {
  const [row] = await db
    .select()
    .from(fieldStyles)
    .where(and(eq(fieldStyles.entityType, entityType), eq(fieldStyles.entityId, entityId), eq(fieldStyles.fieldName, fieldName)));
  if (!row) return null;
  return { fontFamily: row.fontFamily, fontSize: row.fontSize, color: row.color ?? null };
}

export function parseStyleMap(rows: { sectionKey: string; content: string }[]): Record<string, FieldStyle> {
  const map: Record<string, FieldStyle> = {};
  for (const row of rows) {
    if (row.sectionKey.endsWith("_style")) {
      try {
        const parsed = JSON.parse(row.content);
        if (parsed.fontFamily || parsed.fontSize || parsed.color) {
          const baseKey = row.sectionKey.replace(/_style$/, "");
          map[baseKey] = { fontFamily: parsed.fontFamily || null, fontSize: parsed.fontSize || null, color: parsed.color || null };
        }
      } catch {}
    }
  }
  return map;
}

export function collectFonts(styleMap: Record<string, FieldStyle>): string[] {
  return Object.values(styleMap).map((s) => s.fontFamily).filter(Boolean) as string[];
}
