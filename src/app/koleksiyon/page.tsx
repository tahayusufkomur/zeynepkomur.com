export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { collections, collectionArtworks, artworks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import Link from "next/link";

export default async function KoleksiyonlarPage() {
  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  const allCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.isPublished, true))
    .orderBy(asc(collections.createdAt));

  const collectionData = await Promise.all(
    allCollections.map(async (col) => {
      const items = await db
        .select({ artworkId: collectionArtworks.artworkId })
        .from(collectionArtworks)
        .where(eq(collectionArtworks.collectionId, col.id))
        .orderBy(asc(collectionArtworks.sortOrder));

      let coverImage: string | null = null;
      if (items.length > 0) {
        const [first] = await db
          .select({ imagePath: artworks.imagePath })
          .from(artworks)
          .where(eq(artworks.id, items[0].artworkId));
        coverImage = first?.imagePath ?? null;
      }

      return { ...col, coverImage, artworkCount: items.length };
    })
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="koleksiyonlar" navItems={navItems} />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-8 pb-24">
        <header className="py-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-on-surface lowercase">koleksiyonlar</h1>
          <div className="h-1.5 w-32 mt-6" style={{ backgroundColor: "#ffd709" }} />
        </header>

        {collectionData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-on-surface-variant text-lg lowercase">
            henüz yayınlanmış koleksiyon bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {collectionData.map((col) => (
              <Link
                key={col.id}
                href={`/koleksiyon/${col.slug}`}
                className="group flex flex-col bg-background border border-surface-container-highest/50 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-container">
                  {col.coverImage ? (
                    <img src={col.coverImage} alt={col.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline/20 text-7xl">collections_bookmark</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-on-surface lowercase mb-2">{col.title}</h2>
                  {col.description && (
                    <p className="text-sm text-on-surface-variant lowercase line-clamp-2">{col.description}</p>
                  )}
                  <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-primary">
                    {col.artworkCount} eser
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer variant="white" content={footerContent} />
    </div>
  );
}
