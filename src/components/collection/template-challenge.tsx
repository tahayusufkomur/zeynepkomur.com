import type { Artwork } from "@/components/artwork/artwork-card";

type ChallengeArtwork = Artwork & { dayNumber?: number | null };

type TemplateChallengeProps = {
  artworks: ChallengeArtwork[];
  title: string;
  description?: string;
  metadata?: Record<string, string>;
};

export function TemplateChallenge({
  artworks,
  title,
  description,
  metadata = {},
}: TemplateChallengeProps) {
  return (
    <div>
      {/* Hero Header */}
      <header className="pt-8 pb-16 border-b border-surface-container mb-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase leading-none mb-6">
              <span className="text-primary italic">{title}</span>
            </h1>
            {description && (
              <p className="text-xl text-on-surface-variant font-medium lowercase italic">
                {description}
              </p>
            )}
          </div>
          {(metadata.format || metadata.technique) && (
            <div className="bg-secondary-container p-6 w-full md:w-auto min-w-[280px]">
              {metadata.label && (
                <p className="text-on-secondary-container text-sm font-bold uppercase tracking-widest mb-2">
                  {metadata.label}
                </p>
              )}
              <p className="text-on-secondary-container text-lg font-medium leading-tight">
                {metadata.subtitle}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Info Bar */}
      <section className="py-8 flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          {metadata.format && (
            <>
              <span className="text-sm font-bold tracking-widest uppercase text-on-surface-variant">
                format: {metadata.format}
              </span>
              <div className="h-4 w-[1px] bg-outline-variant opacity-30" />
            </>
          )}
          {metadata.technique && (
            <span className="text-sm font-bold tracking-widest uppercase text-on-surface-variant">
              teknik: {metadata.technique}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-primary" />
          <div className="w-8 h-8 bg-secondary-container" />
          <div className="w-8 h-8 bg-tertiary-container" />
        </div>
      </section>

      {artworks.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-on-surface-variant text-lg lowercase">
          bu koleksiyonda henüz eser bulunmuyor.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 pb-24">
            {artworks.map((artwork) => (
              <article key={artwork.id} className="group">
                <div className="aspect-square bg-surface-container-low overflow-hidden relative">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={artwork.imagePath}
                    alt={artwork.title}
                  />
                  {artwork.dayNumber != null && (
                    <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 text-xs font-bold">
                      #{artwork.dayNumber}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-col">
                  <h3 className="text-lg font-bold lowercase tracking-tight text-on-surface">
                    {artwork.title}
                  </h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-extrabold text-primary text-[10px] uppercase tracking-wider">
                      fiyat için iletişime geçin
                    </span>
                    {artwork.availability === "sold" && (
                      <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest italic">
                        tükendi
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Load more */}
          <div className="mt-4 flex justify-center pb-16">
            <button className="border-2 border-primary text-primary px-12 py-4 font-bold lowercase tracking-tighter hover:bg-primary hover:text-on-primary transition-all duration-300">
              diğer eserleri yükle
            </button>
          </div>
        </>
      )}
    </div>
  );
}
