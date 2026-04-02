export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { pageContent, artworks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Image from "next/image";
import { InlineEdit } from "@/components/admin/inline-edit";
import { Footer } from "@/components/layout/footer";
import { HomeClient } from "./home-client";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import { HomeArtworkOverlay } from "./home-artwork-overlay";
import type { Artwork } from "@/components/artwork/artwork-card";

type ContentMap = Record<string, string>;

const defaults: ContentMap = {
  hero_title: "Sınırsız Sanat",
  hero_subtitle: "modernizmin sınırlarını zorlayan, renk ve formun dansı.",
  new_arrivals_title: "yeni gelenler",
  new_arrivals_description:
    "son eklenen eserler ve koleksiyonlar. zeynep kömür seçkisiyle modern sanatın taze soluğu.",
  quote_text:
    "Her çocuk bir sanatçıdır. Sorun, büyüdüğümüzde sanatçı kalmayı nasıl başaracağımızdır.",
  quote_attribution: "Pablo Picasso",
};

export default async function HomePage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  // Fetch page content
  const rows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "home"));

  const content: ContentMap = { ...defaults };
  for (const row of rows) {
    content[row.sectionKey] = row.content;
  }

  // Fetch latest artworks for bento grid
  const latestArtworks = (await db
    .select()
    .from(artworks)
    .orderBy(desc(artworks.createdAt))
    .limit(3)) as Artwork[];

  return (
    <HomeClient navItems={navItems}>
      {/* Hero Section */}
      <header className="relative min-h-[921px] flex flex-col items-center justify-center bg-white px-6 py-20 overflow-hidden">
        <div className="max-w-5xl w-full text-center z-10">
          <InlineEdit
            pageSlug="home"
            sectionKey="hero_title"
            initialContent={content.hero_title}
            as="h1"
            className="text-6xl md:text-9xl font-light text-on-surface tracking-tighter mb-16 lowercase"
          />

          <HomeArtworkOverlay artwork={latestArtworks[0] ?? null} className="relative w-full aspect-square md:aspect-[21/9] bg-surface-container-low group">
            {/* Decorative accents */}
            <div
              className="absolute -top-8 -left-8 w-32 h-32 z-0"
              style={{ backgroundColor: "#ffd709" }}
            />
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-32 bg-highlight-pink/20 -rotate-1 pointer-events-none" />

            {latestArtworks[0] ? (
              <Image
                src={latestArtworks[0].imagePath}
                alt={latestArtworks[0].title}
                fill
                className="relative z-10 object-cover grayscale-[0.1] hover:grayscale-0 transition-all duration-1000 cursor-crosshair shadow-2xl"
                priority
              />
            ) : (
              <div className="relative z-10 w-full h-full bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-outline/30 text-8xl">
                  palette
                </span>
              </div>
            )}
          </HomeArtworkOverlay>
        </div>

        <InlineEdit
          pageSlug="home"
          sectionKey="hero_subtitle"
          initialContent={content.hero_subtitle}
          as="div"
          className="mt-20 text-on-surface-variant max-w-lg text-center lowercase tracking-[0.2em] font-light italic"
        />
      </header>

      {/* Asymmetric Bento Grid (Yeni Gelenler) */}
      <section className="py-32 px-8 md:px-16 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <InlineEdit
              pageSlug="home"
              sectionKey="new_arrivals_title"
              initialContent={content.new_arrivals_title}
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
            as="p"
            className="text-on-surface-variant max-w-md font-medium text-lg leading-relaxed lowercase"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-10 h-auto md:h-[1100px]">
          {/* Large Card */}
          <HomeArtworkOverlay artwork={latestArtworks[0] ?? null} className="md:col-span-2 md:row-span-2 relative group overflow-hidden bg-surface-container shadow-sm hover:shadow-xl transition-shadow duration-500">
            {latestArtworks[0] ? (
              <Image
                src={latestArtworks[0].imagePath}
                alt={latestArtworks[0].title}
                fill
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full min-h-[400px] bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-outline/20 text-9xl">
                  image
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12 backdrop-blur-[2px]">
              <span className="text-white text-xs font-bold tracking-[0.3em] uppercase mb-4">
                koleksiyon 01
              </span>
              <h3 className="text-white text-4xl font-bold lowercase leading-none">
                {latestArtworks[0]?.title ?? "geometrinin sessizliği"}
              </h3>
            </div>
          </HomeArtworkOverlay>

          {/* Vertical Card */}
          <HomeArtworkOverlay artwork={latestArtworks[1] ?? null} className="md:col-span-1 md:row-span-1 relative group overflow-hidden bg-surface-container-low">
            {latestArtworks[1] ? (
              <Image
                src={latestArtworks[1].imagePath}
                alt={latestArtworks[1].title}
                fill
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-outline/20 text-7xl">
                  image
                </span>
              </div>
            )}
            <div className="absolute top-0 left-0 bg-secondary px-6 py-2 text-xs font-bold text-on-secondary-container tracking-wider uppercase">
              yeni
            </div>
          </HomeArtworkOverlay>

          {/* Pink Highlight Square */}
          <div className="md:col-span-1 md:row-span-1 bg-highlight-pink relative flex items-center justify-center p-12">
            <div className="text-center">
              <span
                className="material-symbols-outlined text-white text-7xl mb-6"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                brush
              </span>
              <p className="text-white font-bold text-xl leading-tight lowercase">
                sanatın dijital <br /> formunda kaybolun.
              </p>
            </div>
          </div>

          {/* Bottom Card */}
          <HomeArtworkOverlay artwork={latestArtworks[2] ?? null} className="md:col-span-2 md:row-span-1 relative group overflow-hidden bg-surface-container-highest">
            {latestArtworks[2] ? (
              <Image
                src={latestArtworks[2].imagePath}
                alt={latestArtworks[2].title}
                fill
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-outline/20 text-7xl">
                  image
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 p-10 bg-white/95 backdrop-blur shadow-2xl text-on-background max-w-sm m-6">
              <h4 className="text-2xl font-bold lowercase mb-2">
                {latestArtworks[2]?.title ?? "atölye günlüğü"}
              </h4>
              <p className="text-base text-on-surface-variant lowercase leading-snug">
                {latestArtworks[2]?.description ??
                  "süreçten sonuca, her fırça darbesinin bir hikayesi var."}
              </p>
            </div>
          </HomeArtworkOverlay>
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
