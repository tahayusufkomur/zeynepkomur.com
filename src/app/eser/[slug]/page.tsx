export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { artworks, collectionArtworks } from "@/lib/db/schema";
import { eq, ne, and, inArray } from "drizzle-orm";
import { attachImages } from "@/lib/db/artwork-with-images";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import type { Artwork } from "@/components/artwork/artwork-card";
import type { Metadata } from "next";
import { ArtworkDetailClient } from "./artwork-detail-client";
import { getEntityFonts, buildGoogleFontsUrl } from "@/lib/fonts";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [artwork] = await db.select().from(artworks).where(eq(artworks.slug, slug));
  if (!artwork) return { title: "Eser Bulunamadi" };
  return {
    title: `${artwork.title} — Zeynep Komur`,
    description: artwork.description,
    openGraph: { images: [artwork.imagePath] },
  };
}

export default async function EserPage({ params }: Props) {
  const { slug } = await params;
  const [artworkRow] = await db.select().from(artworks).where(eq(artworks.slug, slug));
  if (!artworkRow) notFound();

  const [artwork] = (await attachImages([artworkRow])) as Artwork[];

  // Find related artworks: same collection first, then same category
  let related: Artwork[] = [];

  const collectionLinks = await db
    .select({ collectionId: collectionArtworks.collectionId })
    .from(collectionArtworks)
    .where(eq(collectionArtworks.artworkId, artwork.id));

  if (collectionLinks.length > 0) {
    const collectionId = collectionLinks[0].collectionId;
    const siblingIds = await db
      .select({ artworkId: collectionArtworks.artworkId })
      .from(collectionArtworks)
      .where(
        and(
          eq(collectionArtworks.collectionId, collectionId),
          ne(collectionArtworks.artworkId, artwork.id)
        )
      );
    if (siblingIds.length > 0) {
      const rows = await db
        .select()
        .from(artworks)
        .where(inArray(artworks.id, siblingIds.map((s) => s.artworkId)));
      related = (await attachImages(rows)) as Artwork[];
    }
  }

  if (related.length < 4) {
    const categoryRows = await db
      .select()
      .from(artworks)
      .where(and(eq(artworks.category, artwork.category), ne(artworks.id, artwork.id)));
    const categoryArtworks = (await attachImages(categoryRows)) as Artwork[];
    const existingIds = new Set(related.map((r) => r.id));
    for (const a of categoryArtworks) {
      if (!existingIds.has(a.id) && related.length < 4) related.push(a);
    }
  }
  related = related.slice(0, 4);

  // Preload custom fonts for artwork text
  const allArtworkIds = [artwork.id, ...related.map((r) => r.id)];
  const entityFonts = await getEntityFonts("artwork", allArtworkIds);
  const fontsUrl = buildGoogleFontsUrl(entityFonts);

  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      <Navbar currentPage="" navItems={navItems} />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-8 pb-24">
        <nav className="py-6 text-sm text-on-surface-variant lowercase tracking-wider">
          <Link href="/galeri" className="hover:text-primary transition-colors">galeri</Link>
          <span className="mx-2">/</span>
          <Link href={`/galeri?category=${artwork.category}`} className="hover:text-primary transition-colors">{artwork.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">{artwork.title}</span>
        </nav>
        <ArtworkDetailClient artwork={artwork} related={related} />
      </main>
      <Footer variant="white" content={footerContent} />
    </div>
  );
}
