export const dynamic = "force-dynamic";
import { db } from "@/lib/db/index";
import { pageContent } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import { ContactForm } from "@/components/forms/contact-form";
import { QuestionForm } from "@/components/forms/question-form";
import { InlineEdit } from "@/components/admin/inline-edit";
import { parseStyleMap, collectFonts, buildGoogleFontsUrl } from "@/lib/fonts";

async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "contact"),
        eq(pageContent.sectionKey, sectionKey)
      )
    );
  return row?.content ?? fallback;
}

export default async function IletisimPage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();
  const headline = await getContent("headline", "arada bağ kuralım");
  const section1Title = await getContent("section_1_title", "beraber çalışalım.");
  const section2Title = await getContent("section_2_title", "bana her şeyi sorabilirsin.");
  const studioAddress = await getContent("studio_address", "moda, kadıköy, istanbul, türkiye");
  const studioHours = await getContent("studio_hours", "pazartesi - cumartesi, 10:00 - 19:00");
  const studioEmail = await getContent("studio_email", "zeynep.komur4@gmail.com");
  const studioSocial = await getContent("studio_social", "@arada.art");
  const studioPhone = await getContent("studio_phone", "+90 530 250 04 11");

  // Fetch all page content rows for style map
  const allRows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "contact"));
  const styleMap = parseStyleMap(allRows);
  const fontsUrl = buildGoogleFontsUrl(collectFonts(styleMap));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      <Navbar currentPage="iletisim" navItems={navItems} />

      <main className="flex-1 pt-20 pb-16 px-8 md:px-12 max-w-[1280px] mx-auto w-full">
        {/* Hero headline */}
        <div className="mb-12 text-center lg:text-left">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase leading-none">
            <InlineEdit
              pageSlug="contact"
              sectionKey="headline"
              initialContent={headline}
              initialStyle={styleMap["headline"]}
              as="span"
              className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase leading-none"
            />
          </h1>
        </div>

        {/* Section 1: Beraber çalışalım */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6">
              <InlineEdit
                pageSlug="contact"
                sectionKey="section_1_title"
                initialContent={section1Title}
                initialStyle={styleMap["section_1_title"]}
                as="h2"
                className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface lowercase leading-[0.95] mb-4"
              />
            </div>
            <div className="lg:col-span-6">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Pink divider */}
        <div className="w-24 h-1.5 bg-tertiary mb-16 opacity-60" />

        {/* Section 2: Bana her şeyi sorabilirsin */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <QuestionForm />
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 lg:text-right">
              <InlineEdit
                pageSlug="contact"
                sectionKey="section_2_title"
                initialContent={section2Title}
                initialStyle={styleMap["section_2_title"]}
                as="h2"
                className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface lowercase leading-[0.95] mb-4"
              />
            </div>
          </div>
        </section>

        {/* Studio info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="border-t border-outline-variant pt-5">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">
              stüdyo
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_address"
              initialContent={studioAddress}
              initialStyle={styleMap["studio_address"]}
              as="p"
              multiline
              className="text-base text-on-surface lowercase leading-snug"
            />
          </div>
          <div className="border-t border-outline-variant pt-5">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">
              iletişim
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_phone"
              initialContent={studioPhone}
              initialStyle={styleMap["studio_phone"]}
              as="p"
              className="text-base text-on-surface lowercase leading-snug"
            />
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_email"
              initialContent={studioEmail}
              initialStyle={styleMap["studio_email"]}
              as="p"
              className="text-base text-on-surface lowercase leading-snug"
            />
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_social"
              initialContent={studioSocial}
              initialStyle={styleMap["studio_social"]}
              as="p"
              className="text-base text-on-surface lowercase leading-snug"
            />
          </div>
          <div className="border-t border-outline-variant pt-5">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">
              mesai
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_hours"
              initialContent={studioHours}
              initialStyle={styleMap["studio_hours"]}
              as="p"
              multiline
              className="text-base text-on-surface lowercase leading-snug"
            />
          </div>
        </div>
      </main>

      <Footer variant="white" content={footerContent} />
    </div>
  );
}
