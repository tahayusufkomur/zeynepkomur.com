"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryBar } from "@/components/artwork/category-bar";
import { FilterBar } from "@/components/artwork/filter-bar";
import { ArtworkGrid } from "@/components/artwork/artwork-grid";
import { ArtworkFormModal } from "@/components/artwork/artwork-form-modal";
import type { Artwork } from "@/components/artwork/artwork-card";

type GalleryClientProps = {
  artworks: Artwork[];
};

export function GalleryClient({ artworks }: GalleryClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  const filtered = activeCategory
    ? artworks.filter((a) => a.category === activeCategory)
    : artworks;

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
      <FilterBar totalCount={filtered.length} />
      <ArtworkGrid
        artworks={filtered}
        onEdit={(artwork) => setEditingArtwork(artwork)}
        onDelete={async (id) => {
          if (!confirm("Bu eseri silmek istediğinize emin misiniz?")) return;
          await fetch(`/api/artworks/${id}`, { method: "DELETE" });
          router.refresh();
        }}
        onAddNew={() => setShowCreate(true)}
      />

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
