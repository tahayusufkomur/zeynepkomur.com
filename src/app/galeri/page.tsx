import { db } from "@/lib/db/index";
import { artworks, pageContent } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { GalleryClient } from "./gallery-client";
import { InlineEdit } from "@/components/admin/inline-edit";

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
  const allArtworks = await db
    .select()
    .from(artworks)
    .orderBy(asc(artworks.sortOrder));

  const quoteText = await getContent("quote_text", "sanat, görünmeyeni görünür kılmaktır. her fırça darbesi, bir hikayenin başlangıcıdır.");
  const quoteAttribution = await getContent("quote_attribution", "zeynep kömür");

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
              &ldquo;<InlineEdit
                pageSlug="galeri"
                sectionKey="quote_text"
                initialContent={quoteText}
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
