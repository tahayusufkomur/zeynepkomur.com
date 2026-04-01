"use client";

import { useState } from "react";
import type { Artwork } from "@/components/artwork/artwork-card";

type ArtworkSelectorProps = {
  allArtworks: Artwork[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function ArtworkSelector({
  allArtworks,
  selectedIds,
  onChange,
}: ArtworkSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = allArtworks.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="eser ara..."
        className="border border-outline-variant px-4 py-2 text-sm w-full focus:border-primary focus:ring-0 lowercase"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {filtered.map((artwork) => {
          const selected = selectedIds.includes(artwork.id);
          return (
            <label
              key={artwork.id}
              className={`flex flex-col cursor-pointer border-2 transition-colors ${
                selected ? "border-primary" : "border-transparent"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selected}
                onChange={() => toggle(artwork.id)}
              />
              <img
                src={artwork.imagePath}
                alt={artwork.title}
                className="aspect-[3/4] object-cover w-full"
              />
              <div className="p-2 text-xs font-semibold text-on-surface lowercase truncate">
                {artwork.title}
              </div>
              {selected && (
                <div className="text-primary text-[10px] px-2 pb-1 font-bold uppercase tracking-wider">
                  seçildi
                </div>
              )}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-on-surface-variant">
        {selectedIds.length} eser seçildi
      </p>
    </div>
  );
}
