"use client";

import { useAdmin } from "@/hooks/use-admin";
import Image from "next/image";

export type Artwork = {
  id: string;
  title: string;
  description: string;
  category: "resim" | "dekorasyon" | "posterler";
  dimensions: string;
  technique: string;
  year: number | null;
  availability: "available" | "sold" | "contact";
  imagePath: string;
  sortOrder: number;
};

type ArtworkCardProps = {
  artwork: Artwork;
  onEdit?: (artwork: Artwork) => void;
  onDelete?: (id: string) => void;
};

export function ArtworkCard({ artwork, onEdit, onDelete }: ArtworkCardProps) {
  const { isAdmin } = useAdmin();

  return (
    <div className="group flex flex-col bg-background border border-surface-container-highest/50 relative">
      {isAdmin && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Bu eseri silmek istediğinize emin misiniz?")) {
              onDelete(artwork.id);
            }
          }}
          className="absolute top-3 right-3 z-20 bg-error text-on-error w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          aria-label="Sil"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      )}
      <div
        className={`aspect-[3/4] overflow-hidden bg-surface-container ${isAdmin && onEdit ? "cursor-pointer" : ""}`}
        onClick={() => isAdmin && onEdit?.(artwork)}
      >
        <img
          src={artwork.imagePath}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>
      <div className="p-6 flex justify-between items-start">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-on-surface leading-tight">
            {artwork.title}
          </h3>
          <p className="text-sm text-on-surface-variant">{artwork.description}</p>
        </div>
        <span className="font-extrabold text-primary text-[10px] uppercase tracking-wider whitespace-nowrap ml-4">
          fiyat için iletişime geçin
        </span>
      </div>
    </div>
  );
}
