export const dynamic = "force-dynamic";
import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CustomRequestForm } from "@/components/forms/custom-request-form";
import { InlineEdit } from "@/components/admin/inline-edit";
import { OzelIstekImage } from "./ozel-istek-client";

async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "ozel-istek"),
        eq(pageContent.sectionKey, sectionKey)
      )
    );
  return row?.content ?? fallback;
}

export default async function OzelIstekPage() {
  const headline = await getContent("headline", "özelleştirilmiş resim isteği");
  const description = await getContent("description", "mekanınıza ruh katacak, sadece size özel üretilecek bir eser için kürasyon sürecini başlatın.");
  const feature1Title = await getContent("feature_1_title", "renk kürasyonu");
  const feature1Desc = await getContent("feature_1_desc", "mekanınızın ışık ve dokusuna uygun özel pigment seçimi.");
  const feature2Title = await getContent("feature_2_title", "boyut ve oran");
  const feature2Desc = await getContent("feature_2_desc", "duvar ölçülerinize altın oran ile uyumlu özel kanvas üretimi.");
  const feature3Title = await getContent("feature_3_title", "imzalı hikaye");
  const feature3Desc = await getContent("feature_3_desc", "her eser, sürecin hikayesini anlatan ıslak imzalı sertifika ile gelir.");
  const artImage = await getContent("art_image", "/images/custom-request-art.jpg");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="ozel-istek" />

      <main className="flex-1 pt-48 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <header className="mb-20">
          <InlineEdit
            pageSlug="ozel-istek"
            sectionKey="headline"
            initialContent={headline}
            as="h1"
            className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase mb-6 leading-none"
          />
          <InlineEdit
            pageSlug="ozel-istek"
            sectionKey="description"
            initialContent={description}
            as="p"
            multiline
            className="text-on-surface-variant max-w-2xl text-lg lowercase"
          />
        </header>

        {/* Two-column form + info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-surface-container-highest shadow-sm">
          {/* Form side */}
          <section className="lg:col-span-7 bg-white p-8 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 -mr-16 -mt-16 rotate-45" style={{ backgroundColor: "#FFD54F" }} />
            <CustomRequestForm />
          </section>

          {/* Visual side */}
          <section className="lg:col-span-5 bg-white flex flex-col">
            <div className="aspect-square w-full relative group overflow-hidden">
              <OzelIstekImage initialSrc={artImage} />
              <div className="absolute inset-0 opacity-10 mix-blend-multiply pointer-events-none" style={{ backgroundColor: "#085F7F" }} />
            </div>

            <div className="p-12 space-y-8 bg-surface-container flex-grow">
              {/* Feature 1: Renk kürasyonu */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: "#085F7F" }}>
                  <span className="material-symbols-outlined text-white text-sm">palette</span>
                </div>
                <div>
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_1_title" initialContent={feature1Title} as="h3" className="font-bold text-on-surface lowercase mb-1 text-sm" />
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_1_desc" initialContent={feature1Desc} as="p" className="text-xs text-on-surface-variant lowercase" />
                </div>
              </div>

              {/* Feature 2: Boyut ve oran */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: "#FFD54F" }}>
                  <span className="material-symbols-outlined text-on-secondary-container text-sm">aspect_ratio</span>
                </div>
                <div>
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_2_title" initialContent={feature2Title} as="h3" className="font-bold text-on-surface lowercase mb-1 text-sm" />
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_2_desc" initialContent={feature2Desc} as="p" className="text-xs text-on-surface-variant lowercase" />
                </div>
              </div>

              {/* Feature 3: İmzalı hikaye */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: "#F4A261" }}>
                  <span className="material-symbols-outlined text-white text-sm">history_edu</span>
                </div>
                <div>
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_3_title" initialContent={feature3Title} as="h3" className="font-bold text-on-surface lowercase mb-1 text-sm" />
                  <InlineEdit pageSlug="ozel-istek" sectionKey="feature_3_desc" initialContent={feature3Desc} as="p" className="text-xs text-on-surface-variant lowercase" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer variant="white" />
    </div>
  );
}
