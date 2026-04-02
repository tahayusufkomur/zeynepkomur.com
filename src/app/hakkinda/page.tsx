import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import { InlineEdit } from "@/components/admin/inline-edit";
import { HakkindaPortrait, HakkindaSkills, HakkindaIdentityLabel } from "./hakkinda-client";

export const dynamic = "force-dynamic";

async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "hakkinda"),
        eq(pageContent.sectionKey, sectionKey)
      )
    );
  return row?.content ?? fallback;
}

export default async function HakkindaPage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();
  const bio1 = await getContent(
    "bio_1",
    "ZEYN'in hikayesi, sanatı sadece seyredilen bir nesne değil, yaşanan bir mekan haline getirme arzusuyla başladı. İstanbul merkezli multidisipliner sanatçı Zeynep Kömür, modern brutalizm ile geleneksel dokuları harmanlayarak dijital kürasyonun sınırlarını yeniden tanımlıyor."
  );
  const bio2 = await getContent(
    "bio_2",
    "Mimar Sinan Güzel Sanatlar Üniversitesi mezunu olan Kömür, on yılı aşkın süredir hem yerel hem de uluslararası sergilerde eserlerini sergilemekte ve küratörlük yapmaktadır. Onun vizyonu, 'sade ama vurucu' bir estetik anlayışını her esere nakşetmektir."
  );
  const skill1 = await getContent("skill_1", "dijital sanat");
  const skill2 = await getContent("skill_2", "kürasyon");
  const skill3 = await getContent("skill_3", "fotoğrafçılık");
  const identityLabel = await getContent("identity_label", "kurucu & küratör");
  const portraitImage = await getContent("portrait_image", "/uploads/pages/portrait.webp");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar currentPage="hakkinda" navItems={navItems} />

      <main className="flex-1 pt-8 pb-24 px-8 md:px-12 max-w-7xl mx-auto w-full">
        {/* Two-column hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left: Portrait */}
          <div className="lg:col-span-6 relative">
            {/* Yellow accent block */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-secondary-container z-0 opacity-40" />
            <div className="relative z-10 bg-white p-2 shadow-xl">
              <HakkindaPortrait initialSrc={portraitImage} />
            </div>
            {/* Identity label */}
            <div className="absolute -bottom-4 right-4 bg-tertiary text-on-tertiary px-6 py-3 z-20 shadow-lg">
              <HakkindaIdentityLabel initialContent={identityLabel} />
            </div>
          </div>

          {/* Right: Bio content */}
          <div className="lg:col-span-6">
            <header className="mb-10">
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface lowercase leading-[0.85]">
                zeynep <br />
                <span className="text-primary">kömür</span>
              </h1>
              <div className="h-1.5 w-16 bg-secondary-container mt-6" />
            </header>

            <section className="space-y-8">
              <div className="space-y-6">
                <InlineEdit
                  pageSlug="hakkinda"
                  sectionKey="bio_1"
                  initialContent={bio1}
                  as="p"
                  multiline
                  className="text-2xl font-light leading-relaxed text-on-surface"
                />
                <InlineEdit
                  pageSlug="hakkinda"
                  sectionKey="bio_2"
                  initialContent={bio2}
                  as="p"
                  multiline
                  className="text-base text-on-surface-variant leading-relaxed font-normal"
                />
              </div>

              {/* Skill tags */}
              <HakkindaSkills skill1={skill1} skill2={skill2} skill3={skill3} />
            </section>
          </div>
        </div>
      </main>

      <Footer variant="white" content={footerContent} />
    </div>
  );
}
