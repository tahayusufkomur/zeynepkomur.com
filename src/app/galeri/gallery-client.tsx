"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryBar } from "@/components/artwork/category-bar";
import { FilterBar } from "@/components/artwork/filter-bar";
import { ArtworkGrid } from "@/components/artwork/artwork-grid";
import { ArtworkFormModal } from "@/components/artwork/artwork-form-modal";
import { ArtworkLightbox } from "@/components/artwork/artwork-lightbox";
import type { Artwork } from "@/components/artwork/artwork-card";

type GalleryClientProps = {
  artworks: Artwork[];
  dimensions: string[];
  collections: { id: string; title: string }[];
};

export function GalleryClient({ artworks, dimensions, collections }: GalleryClientProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [viewingArtwork, setViewingArtwork] = useState<Artwork | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  let filtered = artworks;

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  if (activeCategory) {
    filtered = filtered.filter((a) => a.category === activeCategory);
  }
  if (selectedDimension) {
    const target = normalize(selectedDimension);
    filtered = filtered.filter((a) => normalize(a.dimensions ?? "") === target);
  }
  if (selectedCollection) {
    filtered = filtered.filter((a) => a.collectionIds?.includes(selectedCollection));
  }

  function handleSaved() {
    setEditingArtwork(null);
    setShowCreate(false);
    router.refresh();
  }

  return (
    <>
      <CategoryBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <FilterBar
        totalCount={filtered.length}
        dimensions={dimensions}
        collections={collections}
        selectedDimension={selectedDimension}
        selectedCollection={selectedCollection}
        onDimensionChange={setSelectedDimension}
        onCollectionChange={setSelectedCollection}
      />
      <ArtworkGrid
        artworks={filtered}
        onClick={(artwork) => setViewingArtwork(artwork)}
        onEdit={(artwork) => setEditingArtwork(artwork)}
        onDelete={async (id) => {
          if (!confirm("Bu eseri silmek istediğinize emin misiniz?")) return;
          await fetch(`/api/artworks/${id}`, { method: "DELETE" });
          router.refresh();
        }}
        onAddNew={() => setShowCreate(true)}
      />

      {viewingArtwork && (
        <ArtworkLightbox
          artwork={viewingArtwork}
          onClose={() => setViewingArtwork(null)}
        />
      )}

      {editingArtwork && (
        <ArtworkFormModal
          artwork={editingArtwork}
          onClose={() => setEditingArtwork(null)}
          onSaved={handleSaved}
        />
      )}

      {showCreate && (
        <ArtworkFormModal
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
