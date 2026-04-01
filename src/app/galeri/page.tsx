import { db } from "@/lib/db/index";
import { artworks } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GalleryClient } from "./gallery-client";

export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  const allArtworks = await db
    .select()
    .from(artworks)
    .orderBy(asc(artworks.sortOrder));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="galeri" />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-8 pb-24">
        <GalleryClient artworks={allArtworks} />

        {/* Artist Quote Section */}
        <section className="mt-32 relative flex justify-center py-24 bg-surface-container-low">
          <div className="absolute left-8 -top-8 w-24 h-24 bg-tertiary-fixed opacity-50" />
          <div className="max-w-2xl text-center z-10 relative">
            <p className="text-3xl font-light italic text-on-surface leading-relaxed px-8">
              &ldquo;sanat, görünmeyeni görünür kılmaktır. her fırça darbesi, bir hikayenin başlangıcıdır.&rdquo;
            </p>
            <div className="mt-8 flex justify-center items-center gap-4">
              <div className="w-12 h-[2px] bg-primary" />
              <span className="font-bold uppercase tracking-widest text-xs">
                zeynep kömür
              </span>
              <div className="w-12 h-[2px] bg-primary" />
            </div>
          </div>
        </section>
      </main>

      <Footer variant="yellow" />
    </div>
  );
}
