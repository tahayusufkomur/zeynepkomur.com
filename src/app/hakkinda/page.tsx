import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { InlineEdit } from "@/components/admin/inline-edit";

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
  const bio1 = await getContent(
    "bio_1",
    "ZEYN'in hikayesi, sanatı sadece seyredilen bir nesne değil, yaşanan bir mekan haline getirme arzusuyla başladı. İstanbul merkezli multidisipliner sanatçı Zeynep Kömür, modern brutalizm ile geleneksel dokuları harmanlayarak dijital kürasyonun sınırlarını yeniden tanımlıyor."
  );
  const bio2 = await getContent(
    "bio_2",
    "Mimar Sinan Güzel Sanatlar Üniversitesi mezunu olan Kömür, on yılı aşkın süredir hem yerel hem de uluslararası sergilerde eserlerini sergilemekte ve küratörlük yapmaktadır. Onun vizyonu, 'sade ama vurucu' bir estetik anlayışını her esere nakşetmektir."
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar currentPage="hakkinda" />

      <main className="flex-1 pt-8 pb-24 px-8 md:px-12 max-w-7xl mx-auto w-full">
        {/* Two-column hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left: Portrait */}
          <div className="lg:col-span-6 relative">
            {/* Yellow accent block */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-secondary-container z-0 opacity-40" />
            <div className="relative z-10 bg-white p-2 shadow-xl">
              <img
                src="/uploads/pages/portrait.webp"
                alt="Zeynep Kömür"
                className="w-full aspect-[4/5] object-cover grayscale"
              />
            </div>
            {/* Identity label */}
            <div className="absolute -bottom-4 right-4 bg-tertiary text-on-tertiary px-6 py-3 z-20 shadow-lg">
              <span className="font-bold text-sm tracking-widest lowercase">
                kurucu &amp; küratör
              </span>
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
              <div className="flex flex-wrap gap-3 pt-6">
                <div className="flex items-center gap-2 bg-secondary-container px-4 py-2 text-on-secondary-container text-xs font-bold tracking-widest lowercase">
                  <span className="material-symbols-outlined text-sm">palette</span>
                  dijital sanat
                </div>
                <div className="flex items-center gap-2 bg-tertiary-container px-4 py-2 text-on-tertiary-container text-xs font-bold tracking-widest lowercase">
                  <span className="material-symbols-outlined text-sm">architecture</span>
                  kürasyon
                </div>
                <div className="flex items-center gap-2 bg-primary-container px-4 py-2 text-on-primary-container text-xs font-bold tracking-widest lowercase">
                  <span className="material-symbols-outlined text-sm">frame_person</span>
                  fotoğrafçılık
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer variant="white" />
    </div>
  );
}
