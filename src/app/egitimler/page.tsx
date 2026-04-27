export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { trainings, pageContent } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import { InlineEdit } from "@/components/admin/inline-edit";
import { parseStyleMap, collectFonts, buildGoogleFontsUrl } from "@/lib/fonts";
import { TrainingsClient } from "./trainings-client";

async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(and(eq(pageContent.pageSlug, "egitimler"), eq(pageContent.sectionKey, sectionKey)));
  return row?.content ?? fallback;
}

export default async function EgitimlerPage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  const allTrainings = await db.select().from(trainings).orderBy(asc(trainings.sortOrder));

  const heroTitle = await getContent("hero_title", "eğitimler");
  const heroDesc = await getContent(
    "hero_description",
    "birebir online derslerden atölyelere, sanatla tanışın. her eğitim kendi tempomunda, sizin ritminize göre şekillenir."
  );

  const allRows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "egitimler"));
  const styleMap = parseStyleMap(allRows);
  const fontsUrl = buildGoogleFontsUrl(collectFonts(styleMap));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      <Navbar currentPage="egitimler" navItems={navItems} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-8 pb-24">
        <header className="py-16">
          <InlineEdit
            pageSlug="egitimler"
            sectionKey="hero_title"
            initialContent={heroTitle}
            initialStyle={styleMap["hero_title"]}
            as="h1"
            className="text-5xl md:text-7xl font-bold tracking-tighter text-on-surface lowercase"
          />
          <div className="h-1.5 w-32 mt-6" style={{ backgroundColor: "#ffd709" }} />
          <InlineEdit
            pageSlug="egitimler"
            sectionKey="hero_description"
            initialContent={heroDesc}
            initialStyle={styleMap["hero_description"]}
            as="p"
            multiline
            className="mt-8 text-on-surface-variant max-w-2xl text-lg lowercase leading-relaxed"
          />
        </header>

        <TrainingsClient trainings={allTrainings} />
      </main>

      <Footer variant="white" content={footerContent} />
    </div>
  );
}
