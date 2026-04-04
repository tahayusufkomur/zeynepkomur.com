import Link from "next/link";
import type { Artwork } from "@/components/artwork/artwork-card";
import { StyleableText } from "@/components/admin/styleable-text";

type TemplateGridProps = {
  artworks: Artwork[];
  title: string;
  description?: string;
};

export function TemplateGrid({ artworks, title, description }: TemplateGridProps) {
  return (
    <div>
      <header className="mb-16 pt-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase leading-none mb-4">
          {title}
        </h1>
        {description && (
          <p className="text-on-surface-variant text-lg lowercase max-w-2xl">
            {description}
          </p>
        )}
        <div className="h-1 w-24 bg-primary mt-6" />
      </header>

      {artworks.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-on-surface-variant text-lg lowercase">
          bu koleksiyonda henüz eser bulunmuyor.
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {artworks.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/eser/${artwork.slug}`}
              className="group flex flex-col bg-background border border-surface-container-highest/50"
            >
              <div className="aspect-[3/4] overflow-hidden bg-surface-container">
                <img
                  src={artwork.imagePath}
                  alt={artwork.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6 flex justify-between items-start">
                <div className="flex flex-col">
                  <StyleableText entityType="artwork" entityId={artwork.id} fieldName="title" as="h3" className="text-lg font-bold text-on-surface leading-tight">
                    {artwork.title}
                  </StyleableText>
                  <StyleableText entityType="artwork" entityId={artwork.id} fieldName="description" as="p" className="text-sm text-on-surface-variant">
                    {artwork.description}
                  </StyleableText>
                </div>
                <span className="font-extrabold text-primary text-[10px] uppercase tracking-wider whitespace-nowrap ml-4">
                  fiyat için iletişime geçin
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
