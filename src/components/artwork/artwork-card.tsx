"use client";

import { useAdmin } from "@/hooks/use-admin";
import Image from "next/image";

export type ArtworkImage = {
  id: string;
  imagePath: string;
  sortOrder: number;
};

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
  images: ArtworkImage[];
  sortOrder: number;
};

type ArtworkCardProps = {
  artwork: Artwork;
  onClick?: (artwork: Artwork) => void;
  onEdit?: (artwork: Artwork) => void;
  onDelete?: (id: string) => void;
};

export function ArtworkCard({ artwork, onClick, onEdit, onDelete }: ArtworkCardProps) {
  const { isEditing } = useAdmin();

  return (
    <div className="group flex flex-col bg-background border border-surface-container-highest/50 relative">
      {isEditing && onDelete && (
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
      {artwork.images.length > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-on-surface px-2 py-1 flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-xs">photo_library</span>
          <span className="text-[10px] font-bold">{artwork.images.length + 1}</span>
        </div>
      )}
      <div
        className={`aspect-[3/4] overflow-hidden bg-surface-container ${isEditing && onEdit ? "cursor-pointer" : onClick ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (isEditing && onEdit) {
            onEdit(artwork);
          } else if (onClick) {
            onClick(artwork);
          }
        }}
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
