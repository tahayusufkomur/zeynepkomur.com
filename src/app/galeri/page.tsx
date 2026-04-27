import { db } from "@/lib/db/index";
import { artworks, pageContent, collections, collectionArtworks } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { attachImages } from "@/lib/db/artwork-with-images";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import { GalleryClient } from "./gallery-client";
import { InlineEdit } from "@/components/admin/inline-edit";
import { parseStyleMap, collectFonts, buildGoogleFontsUrl } from "@/lib/fonts";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function getContent(sectionKey: string, fallback: string) {
  const [row] = await db
    .select()
    .from(pageContent)
    .where(
      and(
        eq(pageContent.pageSlug, "galeri"),
        eq(pageContent.sectionKey, sectionKey)
      )
    );
  return row?.content ?? fallback;
}

export default async function GaleriPage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();
  const rawArtworks = await db
    .select()
    .from(artworks)
    .orderBy(asc(artworks.sortOrder));
  const allArtworks = await attachImages(rawArtworks);

  // Fetch distinct dimensions for filter — dedupe by normalized form (trim + collapse spaces + lowercase)
  const dimensionByNormalized = new Map<string, string>();
  for (const a of rawArtworks) {
    const trimmed = a.dimensions?.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
    if (!dimensionByNormalized.has(normalized)) {
      dimensionByNormalized.set(normalized, trimmed);
    }
  }
  const distinctDimensions = [...dimensionByNormalized.values()].sort();

  // Fetch published collections for filter
  const publishedCollections = await db
    .select({ id: collections.id, title: collections.title })
    .from(collections)
    .where(eq(collections.isPublished, true));

  // Attach collectionIds to each artwork
  const allCollectionLinks = await db
    .select({
      artworkId: collectionArtworks.artworkId,
      collectionId: collectionArtworks.collectionId,
    })
    .from(collectionArtworks);

  const collectionMap = new Map<string, string[]>();
  for (const link of allCollectionLinks) {
    const ids = collectionMap.get(link.artworkId) ?? [];
    ids.push(link.collectionId);
    collectionMap.set(link.artworkId, ids);
  }

  const artworksWithCollections = allArtworks.map((a) => ({
    ...a,
    collectionIds: collectionMap.get(a.id) ?? [],
  }));

  const quoteText = await getContent("quote_text", "sanat, görünmeyeni görünür kılmaktır. her fırça darbesi, bir hikayenin başlangıcıdır.");
  const quoteAttribution = await getContent("quote_attribution", "zeynep kömür");

  // Fetch all page content rows for style map
  const allRows = await db
    .select()
    .from(pageContent)
    .where(eq(pageContent.pageSlug, "galeri"));
  const styleMap = parseStyleMap(allRows);
  const fontsUrl = buildGoogleFontsUrl(collectFonts(styleMap));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      <Navbar currentPage="galeri" navItems={navItems} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-8 pb-24">
        <Suspense fallback={null}>
          <GalleryClient
            artworks={artworksWithCollections}
            dimensions={distinctDimensions}
            collections={publishedCollections}
          />
        </Suspense>

        {/* Artist Quote Section */}
        <section className="mt-32 relative flex justify-center py-24 bg-surface-container-low">
          <div className="absolute left-8 -top-8 w-24 h-24 bg-tertiary-fixed opacity-50" />
          <div className="max-w-2xl text-center z-10 relative">
            <p className="text-3xl font-light italic text-on-surface leading-relaxed px-8">
              &ldquo;<InlineEdit
                pageSlug="galeri"
                sectionKey="quote_text"
                initialContent={quoteText}
                initialStyle={styleMap["quote_text"]}
                as="span"
                className="text-3xl font-light italic text-on-surface leading-relaxed"
                multiline
              />&rdquo;
            </p>
            <div className="mt-8 flex justify-center items-center gap-4">
              <div className="w-12 h-[2px] bg-primary" />
              <InlineEdit
                pageSlug="galeri"
                sectionKey="quote_attribution"
                initialContent={quoteAttribution}
                initialStyle={styleMap["quote_attribution"]}
                as="span"
                className="font-bold uppercase tracking-widest text-xs"
              />
              <div className="w-12 h-[2px] bg-primary" />
            </div>
          </div>
        </section>
      </main>

      <Footer variant="yellow" content={footerContent} />
    </div>
  );
}
