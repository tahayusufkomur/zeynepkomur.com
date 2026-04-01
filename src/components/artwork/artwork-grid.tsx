"use client";

import { useAdmin } from "@/hooks/use-admin";
import { ArtworkCard, type Artwork } from "./artwork-card";
import Link from "next/link";

type ArtworkGridProps = {
  artworks: Artwork[];
  onEdit?: (artwork: Artwork) => void;
  onDelete?: (id: string) => void;
  onAddNew?: () => void;
};

export function ArtworkGrid({ artworks, onEdit, onDelete, onAddNew }: ArtworkGridProps) {
  const { isAdmin } = useAdmin();

  return (
    <div className="relative">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {artworks.map((artwork) => (
          <ArtworkCard
            key={artwork.id}
            artwork={artwork}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* CTA Card */}
        <div className="col-span-1 sm:col-span-2 flex items-center justify-center bg-secondary-container p-12 text-center relative overflow-hidden group">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -left-12 -top-12 w-64 h-64 bg-tertiary-dim rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl font-extrabold tracking-tighter text-on-secondary-container mb-6 max-w-sm">
              hayalindeki eseri beraber tasarlayalım
            </h2>
            <Link
              href="/ozel-istek"
              className="bg-primary text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-surface-tint transition-colors duration-300 shadow-xl"
            >
              ÖZELLEŞTİRİLMİŞ RESİM İSTEKLERİ
            </Link>
          </div>
        </div>
      </section>

      {/* Admin: Add new artwork button */}
      {isAdmin && onAddNew && (
        <button
          onClick={onAddNew}
          className="fixed bottom-8 right-8 z-50 bg-primary text-on-primary px-6 py-4 font-bold shadow-xl hover:bg-primary-dim transition-all duration-300 flex items-center gap-3"
        >
          <span className="material-symbols-outlined">add</span>
          Yeni Eser Ekle
        </button>
      )}
    </div>
  );
}
