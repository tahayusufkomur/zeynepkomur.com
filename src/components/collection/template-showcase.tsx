import type { Artwork } from "@/components/artwork/artwork-card";

type TemplateShowcaseProps = {
  artworks: Artwork[];
  title: string;
  description?: string;
};

export function TemplateShowcase({ artworks, title, description }: TemplateShowcaseProps) {
  const [hero, ...rest] = artworks;

  return (
    <div>
      {/* Hero Section */}
      <header className="mb-12 pt-12">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface lowercase leading-none mb-4">
          {title}
        </h1>
        {description && (
          <p className="text-on-surface-variant text-lg lowercase max-w-2xl italic">
            {description}
          </p>
        )}
        <div className="h-1 w-24 bg-secondary-container mt-6" />
      </header>

      {artworks.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-on-surface-variant text-lg lowercase">
          bu koleksiyonda henüz eser bulunmuyor.
        </div>
      ) : (
        <>
          {/* Hero artwork */}
          {hero && (
            <div className="mb-10 relative group overflow-hidden">
              <img
                src={hero.imagePath}
                alt={hero.title}
                className="w-full h-[60vh] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                <h2 className="text-white text-4xl font-extrabold tracking-tighter lowercase">
                  {hero.title}
                </h2>
                <p className="text-white/80 lowercase">{hero.description}</p>
              </div>
            </div>
          )}

          {/* Bento grid for remaining artworks */}
          {rest.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {rest.map((artwork, i) => (
                <div
                  key={artwork.id}
                  className={`group overflow-hidden bg-surface-container relative ${
                    i === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <img
                    src={artwork.imagePath}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[200px]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end p-4 opacity-0 group-hover:opacity-100">
                    <span className="text-white font-bold lowercase text-sm">
                      {artwork.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
