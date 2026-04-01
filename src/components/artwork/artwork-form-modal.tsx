"use client";

import { useState, useRef } from "react";
import { showToast } from "@/components/admin/toast";
import type { Artwork } from "./artwork-card";

type ArtworkFormModalProps = {
  artwork?: Artwork | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ArtworkFormModal({ artwork, onClose, onSaved }: ArtworkFormModalProps) {
  const [title, setTitle] = useState(artwork?.title ?? "");
  const [description, setDescription] = useState(artwork?.description ?? "");
  const [category, setCategory] = useState<"resim" | "dekorasyon" | "posterler">(artwork?.category ?? "resim");
  const [dimensions, setDimensions] = useState(artwork?.dimensions ?? "");
  const [technique, setTechnique] = useState(artwork?.technique ?? "");
  const [year, setYear] = useState(artwork?.year?.toString() ?? "");
  const [availability, setAvailability] = useState<"available" | "sold" | "contact">(artwork?.availability ?? "available");
  const [imagePath, setImagePath] = useState(artwork?.imagePath ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!artwork;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "artworks");
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { path } = await res.json();
      setImagePath(path);
    } catch {
      showToast("görsel yüklenemedi", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imagePath) {
      showToast("lütfen bir görsel yükleyin", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title,
        description,
        category,
        dimensions,
        technique,
        year: year ? parseInt(year) : null,
        availability,
        imagePath,
      };
      const url = isEditing ? `/api/artworks/${artwork.id}` : "/api/artworks";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showToast(isEditing ? "eser güncellendi" : "eser eklendi", "success");
      onSaved();
    } catch {
      showToast("kaydedilemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">
            {isEditing ? "eseri düzenle" : "yeni eser ekle"}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Image upload zone */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
              Görsel
            </label>
            <div
              className="relative flex flex-col items-center justify-center w-full h-48 bg-surface-container-low border-2 border-dashed border-outline-variant hover:border-primary transition-colors cursor-pointer overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {imagePath ? (
                <img src={imagePath} alt="Önizleme" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">
                    {uploading ? "progress_activity" : "upload_file"}
                  </span>
                  <span className="text-xs text-on-surface-variant lowercase">
                    görsel yüklemek için tıklayın
                  </span>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
              placeholder="eser başlığı"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Açıklama</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
              placeholder="yağlı boya tablosu"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase"
            >
              <option value="resim">resim</option>
              <option value="dekorasyon">dekorasyon</option>
              <option value="posterler">posterler</option>
            </select>
          </div>

          {/* Dimensions + Technique */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Boyutlar</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
                placeholder="50x70 cm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Teknik</label>
              <input
                type="text"
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
                placeholder="yağlı boya"
              />
            </div>
          </div>

          {/* Year + Availability */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Yıl</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Durum</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
                className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase"
              >
                <option value="available">mevcut</option>
                <option value="sold">satıldı</option>
                <option value="contact">iletişime geçin</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50"
            >
              {saving ? "kaydediliyor..." : isEditing ? "güncelle" : "ekle"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-outline-variant text-on-surface px-8 py-3 font-bold tracking-tight hover:bg-surface-container transition-all duration-300"
            >
              iptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
