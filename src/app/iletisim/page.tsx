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
  const studioEmail = await getContent("studio_email", "merhaba@zeynepkomur.com");
  const studioSocial = await getContent("studio_social", "@zeynepkomur.com");

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

      <main className="flex-1 pt-48 pb-24 px-8 md:px-16 max-w-[1440px] mx-auto w-full">
        {/* Hero headline */}
        <div className="mb-24 text-center lg:text-left">
          <h1 className="text-8xl md:text-[10rem] font-extrabold tracking-tighter text-on-surface lowercase leading-none">
            <InlineEdit
              pageSlug="contact"
              sectionKey="headline"
              initialContent={headline}
              initialStyle={styleMap["headline"]}
              as="span"
              className="text-8xl md:text-[10rem] font-extrabold tracking-tighter text-on-surface lowercase leading-none"
            />
          </h1>
        </div>

        {/* Section 1: Beraber çalışalım */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <InlineEdit
                pageSlug="contact"
                sectionKey="section_1_title"
                initialContent={section1Title}
                initialStyle={styleMap["section_1_title"]}
                as="h2"
                className="text-7xl md:text-[9rem] font-extrabold tracking-tighter text-on-surface lowercase leading-[0.85] mb-8"
              />
            </div>
            <div className="lg:col-span-5 lg:pt-8">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Pink divider */}
        <div className="w-32 h-2 bg-tertiary mb-48 opacity-60" />

        {/* Section 2: Bana her şeyi sorabilirsin */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-5 order-2 lg:order-1 lg:pb-8">
              <QuestionForm />
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2 text-right">
              <InlineEdit
                pageSlug="contact"
                sectionKey="section_2_title"
                initialContent={section2Title}
                initialStyle={styleMap["section_2_title"]}
                as="h2"
                className="text-7xl md:text-[9rem] font-extrabold tracking-tighter text-on-surface lowercase leading-[0.85] mb-8"
              />
            </div>
          </div>
        </section>

        {/* Studio info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-24 mb-32">
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              stüdyo
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_address"
              initialContent={studioAddress}
              initialStyle={styleMap["studio_address"]}
              as="p"
              multiline
              className="text-2xl text-on-surface lowercase leading-tight"
            />
          </div>
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              mesai
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_hours"
              initialContent={studioHours}
              initialStyle={styleMap["studio_hours"]}
              as="p"
              multiline
              className="text-2xl text-on-surface lowercase leading-tight"
            />
          </div>
          <div className="border-t border-outline-variant pt-8">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
              dijital
            </p>
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_email"
              initialContent={studioEmail}
              initialStyle={styleMap["studio_email"]}
              as="p"
              className="text-2xl text-on-surface lowercase leading-tight"
            />
            <InlineEdit
              pageSlug="contact"
              sectionKey="studio_social"
              initialContent={studioSocial}
              initialStyle={styleMap["studio_social"]}
              as="p"
              className="text-2xl text-on-surface lowercase leading-tight mt-1"
            />
          </div>
        </div>
      </main>

      <Footer variant="white" content={footerContent} />
    </div>
  );
}
