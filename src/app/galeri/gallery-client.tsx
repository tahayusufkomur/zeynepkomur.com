"use client";

import { useState } from "react";
import { CategoryBar } from "@/components/artwork/category-bar";
import { FilterBar } from "@/components/artwork/filter-bar";
import { ArtworkGrid } from "@/components/artwork/artwork-grid";
import type { Artwork } from "@/components/artwork/artwork-card";

type GalleryClientProps = {
  artworks: Artwork[];
};

export function GalleryClient({ artworks }: GalleryClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? artworks.filter((a) => a.category === activeCategory)
    : artworks;

  return (
    <>
      <CategoryBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <FilterBar totalCount={filtered.length} />
      <ArtworkGrid artworks={filtered} />
    </>
  );
}
