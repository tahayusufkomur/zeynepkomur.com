export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/index";
import { collections, collectionArtworks, artworks } from "@/lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { attachImages } from "@/lib/db/artwork-with-images";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TemplateGrid } from "@/components/collection/template-grid";
import { TemplateShowcase } from "@/components/collection/template-showcase";
import { TemplateChallenge } from "@/components/collection/template-challenge";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import type { Artwork } from "@/components/artwork/artwork-card";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function KoleksiyonPage({ params }: Props) {
  const { slug } = await params;

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, slug));

  if (!collection || !collection.isPublished) {
    notFound();
  }

  // Get artworks in this collection
  const collectionItems = await db
    .select()
    .from(collectionArtworks)
    .where(eq(collectionArtworks.collectionId, collection.id))
    .orderBy(asc(collectionArtworks.sortOrder));

  let collectionArtworkList: (Artwork & { dayNumber?: number | null })[] = [];

  if (collectionItems.length > 0) {
    const artworkIds = collectionItems.map((ci) => ci.artworkId);
    const artworkRows = await db
      .select()
      .from(artworks)
      .where(inArray(artworks.id, artworkIds));
    const artworkRowsWithImages = await attachImages(artworkRows);

    // Preserve order from collectionItems + attach dayNumber
    collectionArtworkList = collectionItems
      .map((ci) => {
        const artwork = artworkRowsWithImages.find((a) => a.id === ci.artworkId);
        if (!artwork) return null;
        return { ...artwork, dayNumber: ci.dayNumber };
      })
      .filter(Boolean) as (Artwork & { dayNumber?: number | null })[];
  }

  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  let metadata: Record<string, string> = {};
  try {
    metadata = JSON.parse(collection.metadata || "{}");
  } catch {
    metadata = {};
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="galeri" navItems={navItems} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 pb-24">
        {collection.templateType === "grid" && (
          <TemplateGrid
            artworks={collectionArtworkList}
            title={collection.title}
            description={collection.description}
          />
        )}
        {collection.templateType === "showcase" && (
          <TemplateShowcase
            artworks={collectionArtworkList}
            title={collection.title}
            description={collection.description}
          />
        )}
        {collection.templateType === "challenge" && (
          <TemplateChallenge
            artworks={collectionArtworkList}
            title={collection.title}
            description={collection.description}
            metadata={metadata}
          />
        )}
      </main>

      <Footer variant="yellow" content={footerContent} />
    </div>
  );
}
