"use client";

import { useState } from "react";
import Link from "next/link";
import type { Artwork } from "@/components/artwork/artwork-card";
import { StyleableText } from "@/components/admin/styleable-text";

type Props = {
  artwork: Artwork;
  related: Artwork[];
};

export function ArtworkDetailClient({ artwork, related }: Props) {
  const allImages = [
    { imagePath: artwork.imagePath, id: "cover" },
    ...artwork.images,
  ];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
        <div>
          <div className="aspect-[3/4] relative bg-surface-container-low overflow-hidden mb-4">
            <img src={allImages[activeIndex].imagePath} alt={artwork.title} className="w-full h-full object-cover" />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${i === activeIndex ? "border-primary" : "border-transparent"}`}
                >
                  <img src={img.imagePath} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <StyleableText entityType="artwork" entityId={artwork.id} fieldName="title" as="h1" className="text-4xl md:text-5xl font-bold tracking-tighter text-on-surface lowercase mb-4">
            {artwork.title}
          </StyleableText>
          <StyleableText entityType="artwork" entityId={artwork.id} fieldName="description" as="p" className="text-lg text-on-surface-variant lowercase mb-8">
            {artwork.description}
          </StyleableText>
          <dl className="space-y-4 mb-10">
            {artwork.dimensions && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24">boyut</dt>
                <dd className="text-on-surface lowercase">{artwork.dimensions}</dd>
              </div>
            )}
            {artwork.technique && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24">teknik</dt>
                <dd className="text-on-surface lowercase">{artwork.technique}</dd>
              </div>
            )}
            {artwork.year && (
              <div className="flex gap-4">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-primary w-24">yil</dt>
                <dd className="text-on-surface">{artwork.year}</dd>
              </div>
            )}
          </dl>
          <Link href="/iletisim" className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 lowercase w-fit">
            <span className="material-symbols-outlined text-lg">mail</span>
            fiyat icin iletisime gecin
          </Link>
        </div>
      </div>
      {related.length > 0 && (
        <section className="border-t border-surface-container pt-16">
          <h2 className="text-3xl font-bold tracking-tighter text-on-surface lowercase mb-10">benzer eserler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {related.map((art) => (
              <Link key={art.id} href={`/eser/${art.slug}`} className="group flex flex-col bg-background border border-surface-container-highest/50">
                <div className="aspect-[3/4] overflow-hidden bg-surface-container">
                  <img src={art.imagePath} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-on-surface leading-tight lowercase">{art.title}</h3>
                  <p className="text-sm text-on-surface-variant">{art.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
