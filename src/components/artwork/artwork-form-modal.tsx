"use client";

import { useState, useRef } from "react";
import { showToast } from "@/components/admin/toast";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { Artwork, ArtworkImage } from "./artwork-card";

type ArtworkFormModalProps = {
  artwork?: Artwork | null;
  onClose: () => void;
  onSaved: () => void;
};

const DIMENSION_OPTIONS = [
  "10 x 15 cm",
  "30 x 30 cm",
  "35 x 50 cm",
  "50 x 70 cm",
  "70 x 100 cm",
];

export function ArtworkFormModal({ artwork, onClose, onSaved }: ArtworkFormModalProps) {
  const [title, setTitle] = useState(artwork?.title ?? "");
  const [description, setDescription] = useState(artwork?.description ?? "");
  const [category, setCategory] = useState<"resim" | "dekorasyon" | "posterler">(artwork?.category ?? "resim");
  const [dimensions, setDimensions] = useState(artwork?.dimensions ?? "");
  const [technique, setTechnique] = useState(artwork?.technique ?? "");
  const [year, setYear] = useState(artwork?.year?.toString() ?? "");
  const [availability, setAvailability] = useState<"available" | "sold" | "contact">(artwork?.availability ?? "available");
  const [imagePath, setImagePath] = useState(artwork?.imagePath ?? "");
  const [additionalImages, setAdditionalImages] = useState<ArtworkImage[]>(artwork?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const additionalFileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!artwork;

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "artworks");
    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    if (!res.ok) return null;
    const { path } = await res.json();
    return path;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      if (!path) throw new Error();
      setImagePath(path);
    } catch {
      showToast("görsel yüklenemedi", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleAdditionalUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAdditional(true);
    try {
      const newImages: ArtworkImage[] = [];
      for (const file of Array.from(files)) {
        const path = await uploadFile(file);
        if (path) {
          newImages.push({
            id: crypto.randomUUID(),
            imagePath: path,
            sortOrder: additionalImages.length + newImages.length,
          });
        }
      }
      setAdditionalImages((prev) => [...prev, ...newImages]);
    } catch {
      showToast("görseller yüklenemedi", "error");
    } finally {
      setUploadingAdditional(false);
      if (additionalFileRef.current) additionalFileRef.current.value = "";
    }
  }

  function removeAdditionalImage(index: number) {
    setAdditionalImages((prev) => prev.filter((_, i) => i !== index));
  }

  function promoteTocover(index: number) {
    const img = additionalImages[index];
    const oldCover = imagePath;
    setImagePath(img.imagePath);
    setAdditionalImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (oldCover) {
        next.unshift({ id: crypto.randomUUID(), imagePath: oldCover, sortOrder: 0 });
      }
      return next.map((item, i) => ({ ...item, sortOrder: i }));
    });
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
        images: additionalImages.map((img, i) => ({
          imagePath: img.imagePath,
          sortOrder: i,
        })),
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

  async function handleDelete() {
    if (!artwork) return;
    if (!confirm("Bu eseri silmek istediğinize emin misiniz?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/artworks/${artwork.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("eser silindi", "success");
      onSaved();
    } catch {
      showToast("silinemedi", "error");
    } finally {
      setDeleting(false);
    }
  }

  const totalImages = (imagePath ? 1 : 0) + additionalImages.length;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
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
          {/* Cover image upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
              Kapak Görseli
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
                    kapak görseli yüklemek için tıklayın
                  </span>
                </>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} />
          </div>

          {/* Additional images */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
              Ek Görseller ({totalImages} görsel)
            </label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {additionalImages.map((img, i) => (
                <div key={img.id} className="relative group aspect-square bg-surface-container overflow-hidden">
                  <img src={img.imagePath} alt={`Görsel ${i + 2}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => promoteTocover(i)}
                      className="bg-white text-primary w-7 h-7 flex items-center justify-center shadow-md"
                      title="Kapak yap"
                    >
                      <span className="material-symbols-outlined text-sm">star</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(i)}
                      className="bg-white text-error w-7 h-7 flex items-center justify-center shadow-md"
                      title="Kaldır"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-white/80 text-[9px] font-bold px-1 rounded">
                    {i + 2}
                  </div>
                </div>
              ))}

              {/* Add more button */}
              <div
                className="aspect-square bg-surface-container-low border-2 border-dashed border-outline-variant hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center"
                onClick={() => additionalFileRef.current?.click()}
              >
                {uploadingAdditional ? (
                  <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl text-outline-variant">add_photo_alternate</span>
                    <span className="text-[9px] text-on-surface-variant mt-1">ekle</span>
                  </>
                )}
              </div>
            </div>
            <input
              ref={additionalFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleAdditionalUpload}
            />
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

          {/* Description (rich text) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Açıklama</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
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
              <select
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
              >
                <option value="">seç</option>
                {DIMENSION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                {dimensions && !DIMENSION_OPTIONS.includes(dimensions) && (
                  <option value={dimensions}>{dimensions} (eski değer)</option>
                )}
              </select>
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
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="ml-auto bg-error text-on-error px-8 py-3 font-bold tracking-tight hover:bg-error/80 transition-all duration-300 disabled:opacity-50"
              >
                {deleting ? "siliniyor..." : "sil"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
