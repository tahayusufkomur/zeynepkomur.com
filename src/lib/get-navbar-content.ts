import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type NavItem = {
  key: string;
  href: string;
  label: string;
  page: string;
  hidden: boolean;
};

const DEFAULT_NAV: NavItem[] = [
  { key: "anasayfa", href: "/", label: "anasayfa", page: "anasayfa", hidden: false },
  { key: "galeri", href: "/galeri", label: "galeri", page: "galeri", hidden: false },
  { key: "koleksiyonlar", href: "/koleksiyon", label: "koleksiyonlar", page: "koleksiyonlar", hidden: false },
  { key: "hakkinda", href: "/hakkinda", label: "hakkında", page: "hakkinda", hidden: false },
  { key: "iletisim", href: "/iletisim", label: "iletişim", page: "iletisim", hidden: false },
];

export async function getNavbarContent(): Promise<NavItem[]> {
  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "navbar"));

  const contentMap: Record<string, string> = {};
  for (const row of rows) {
    contentMap[row.sectionKey] = row.content;
  }

  return DEFAULT_NAV.map((item) => ({
    ...item,
    label: contentMap[`${item.key}_label`] ?? item.label,
    hidden: contentMap[`${item.key}_hidden`] === "true",
  }));
}
