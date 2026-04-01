import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getFooterContent(): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "footer"));

  const content: Record<string, string> = {};
  for (const row of rows) {
    content[row.sectionKey] = row.content;
  }
  return content;
}
