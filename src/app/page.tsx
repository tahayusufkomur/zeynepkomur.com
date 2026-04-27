export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { pageContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { InlineEdit } from "@/components/admin/inline-edit";
import { PageImageSlot } from "@/components/admin/page-image-slot";
import { Footer } from "@/components/layout/footer";
import { HomeClient } from "./home-client";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import { parseStyleMap, collectFonts, buildGoogleFontsUrl } from "@/lib/fonts";

type ContentMap = Record<string, string>;

const defaults: ContentMap = {
  hero_title: "Sınırsız Sanat",
  hero_subtitle: "modernizmin sınırlarını zorlayan, renk ve formun dansı.",
  new_arrivals_title: "yeni gelenler",
  new_arrivals_description:
    "son eklenen görseller. zeynep kömür seçkisiyle modern sanatın taze soluğu.",
  quote_text:
    "Her çocuk bir sanatçıdır. Sorun, büyüdüğümüzde sanatçı kalmayı nasıl başaracağımızdır.",
  quote_attribution: "Pablo Picasso",
  bento_large_title: "geometrinin sessizliği",
  bento_bottom_title: "atölye günlüğü",
  bento_bottom_desc: "süreçten sonuca, her fırça darbesinin bir hikayesi var.",
  hero_image: "",
  bento_large_image: "",
  bento_vertical_image: "",
  bento_bottom_image: "",
};

export default async function HomePage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "home"));

  const content: ContentMap = { ...defaults };
  for (const row of rows) {
    content[row.sectionKey] = row.content;
  }
  const styleMap = parseStyleMap(rows);
  const fontsUrl = buildGoogleFontsUrl(collectFonts(styleMap));

  return (
    <HomeClient navItems={navItems}>
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}

      {/* Hero Section */}
      <header className="relative min-h-[921px] flex flex-col items-center justify-center bg-white px-6 py-20 overflow-hidden">
        <div className="max-w-5xl w-full text-center z-10">
          <InlineEdit
            pageSlug="home"
            sectionKey="hero_title"
            initialContent={content.hero_title}
            initialStyle={styleMap["hero_title"]}
            as="h1"
            className="text-6xl md:text-9xl font-light text-on-surface tracking-tighter mb-16 lowercase"
          />

          <div className="relative w-full aspect-square md:aspect-[21/9] bg-surface-container-low group">
            {/* Decorative accents */}
            <div
              className="absolute -top-8 -left-8 w-32 h-32 z-0"
              style={{ backgroundColor: "#ffd709" }}
            />
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-32 bg-highlight-pink/20 -rotate-1 pointer-events-none" />

            <PageImageSlot
              pageSlug="home"
              sectionKey="hero_image"
              initialSrc={content.hero_image}
              alt="ana görsel"
              className="absolute inset-0 z-10 shadow-2xl"
              imgClassName="w-full h-full object-cover grayscale-[0.1] hover:grayscale-0 transition-all duration-1000"
            />
          </div>
        </div>

        <InlineEdit
          pageSlug="home"
          sectionKey="hero_subtitle"
          initialContent={content.hero_subtitle}
          initialStyle={styleMap["hero_subtitle"]}
          as="div"
          className="mt-20 text-on-surface-variant max-w-lg text-center lowercase tracking-[0.2em] font-light italic"
        />
      </header>

      {/* Asymmetric Bento Grid */}
      <section className="py-32 px-8 md:px-16 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <InlineEdit
              pageSlug="home"
              sectionKey="new_arrivals_title"
              initialContent={content.new_arrivals_title}
              initialStyle={styleMap["new_arrivals_title"]}
              as="h2"
              className="text-5xl md:text-7xl font-bold tracking-tighter text-on-surface lowercase"
            />
            <div
              className="h-1.5 w-32 mt-6"
              style={{ backgroundColor: "#ffd709" }}
            />
          </div>
          <InlineEdit
            pageSlug="home"
            sectionKey="new_arrivals_description"
            initialContent={content.new_arrivals_description}
            initialStyle={styleMap["new_arrivals_description"]}
            as="p"
            className="text-on-surface-variant max-w-md font-medium text-lg leading-relaxed lowercase"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-10 h-auto md:h-[1100px]">
          {/* Large Card */}
          <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden bg-surface-container shadow-sm hover:shadow-xl transition-shadow duration-500">
            <PageImageSlot
              pageSlug="home"
              sectionKey="bento_large_image"
              initialSrc={content.bento_large_image}
              alt="öne çıkan görsel"
              className="absolute inset-0"
              imgClassName="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12 backdrop-blur-[2px] pointer-events-none">
              <span className="text-white text-xs font-bold tracking-[0.3em] uppercase mb-4">
                öne çıkan
              </span>
              <InlineEdit
                pageSlug="home"
                sectionKey="bento_large_title"
                initialContent={content.bento_large_title}
                initialStyle={styleMap["bento_large_title"]}
                as="h3"
                className="text-white text-4xl font-bold lowercase leading-none pointer-events-auto"
              />
            </div>
          </div>

          {/* Vertical Card */}
          <div className="md:col-span-1 md:row-span-1 relative group overflow-hidden bg-surface-container-low">
            <PageImageSlot
              pageSlug="home"
              sectionKey="bento_vertical_image"
              initialSrc={content.bento_vertical_image}
              alt="görsel"
              className="absolute inset-0"
              imgClassName="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div
              className="absolute top-0 left-0 px-6 py-2 text-xs font-extrabold tracking-wider uppercase pointer-events-none shadow-sm"
              style={{ backgroundColor: "#ffd709", color: "#1a1500" }}
            >
              yeni
            </div>
          </div>

          {/* Pink Highlight Square — links to custom artwork request */}
          <Link
            href="/ozel-istek"
            className="md:col-span-1 md:row-span-1 bg-highlight-pink relative flex items-center justify-center p-12 group cursor-pointer transition-all duration-500 hover:bg-primary"
          >
            <div className="text-center">
              <span
                className="material-symbols-outlined text-white text-7xl mb-6 transition-transform duration-500 group-hover:scale-110"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                brush
              </span>
              <p className="text-white font-bold text-xl leading-tight lowercase">
                sanatın dijital <br /> formunda kaybolun.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-white/80 text-[10px] font-bold uppercase tracking-widest">
                resim siparişi
                <span className="material-symbols-outlined text-sm transition-transform duration-500 group-hover:translate-x-1">arrow_forward</span>
              </span>
            </div>
          </Link>

          {/* Bottom Card */}
          <div className="md:col-span-2 md:row-span-1 relative group overflow-hidden bg-surface-container-highest">
            <PageImageSlot
              pageSlug="home"
              sectionKey="bento_bottom_image"
              initialSrc={content.bento_bottom_image}
              alt="görsel"
              className="absolute inset-0"
              imgClassName="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 p-10 bg-white/95 backdrop-blur shadow-2xl text-on-background max-w-sm m-6 pointer-events-none">
              <InlineEdit
                pageSlug="home"
                sectionKey="bento_bottom_title"
                initialContent={content.bento_bottom_title}
                initialStyle={styleMap["bento_bottom_title"]}
                as="h3"
                className="text-2xl font-bold lowercase mb-2 pointer-events-auto"
              />
              <InlineEdit
                pageSlug="home"
                sectionKey="bento_bottom_desc"
                initialContent={content.bento_bottom_desc}
                initialStyle={styleMap["bento_bottom_desc"]}
                as="p"
                className="text-base text-on-surface-variant lowercase leading-snug pointer-events-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="bg-white py-40 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative">
          <span className="absolute -top-20 left-1/2 -translate-x-1/2 text-[15rem] text-primary/5 font-serif select-none">
            &ldquo;
          </span>
          <blockquote className="relative z-10">
            <InlineEdit
              pageSlug="home"
              sectionKey="quote_text"
              initialContent={content.quote_text}
              initialStyle={styleMap["quote_text"]}
              as="p"
              className="text-4xl md:text-6xl font-light text-on-surface leading-[1.1] tracking-tight lowercase"
              multiline
            />
            <footer className="mt-16 text-highlight-pink font-bold text-xl lowercase tracking-[0.4em]">
              —{" "}
              <InlineEdit
                pageSlug="home"
                sectionKey="quote_attribution"
                initialContent={content.quote_attribution}
                initialStyle={styleMap["quote_attribution"]}
                as="span"
                className="text-highlight-pink font-bold text-xl lowercase tracking-[0.4em]"
              />
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Color Divider */}
      <div className="h-4 w-full flex">
        <div className="flex-grow bg-primary" />
        <div className="flex-grow" style={{ backgroundColor: "#ffd709" }} />
        <div className="flex-grow bg-highlight-pink" />
      </div>

      {/* Footer */}
      <Footer variant="white" content={footerContent} />
    </HomeClient>
  );
}
