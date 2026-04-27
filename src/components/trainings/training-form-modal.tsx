"use client";

import { useState, useRef } from "react";
import { showToast } from "@/components/admin/toast";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

export type Training = {
  id: string;
  title: string;
  slug: string;
  content: string;
  duration: string;
  price: string;
  format: string;
  imagePath: string;
  isPublished: boolean;
  sortOrder: number;
};

type Props = {
  training?: Training | null;
  onClose: () => void;
  onSaved: () => void;
};

export function TrainingFormModal({ training, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(training?.title ?? "");
  const [content, setContent] = useState(training?.content ?? "");
  const [duration, setDuration] = useState(training?.duration ?? "");
  const [price, setPrice] = useState(training?.price ?? "");
  const [format, setFormat] = useState(training?.format ?? "birebir online ders");
  const [imagePath, setImagePath] = useState(training?.imagePath ?? "");
  const [isPublished, setIsPublished] = useState(training?.isPublished ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditing = !!training;

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "pages");
    const res = await fetch("/api/uploads", { method: "POST", body: formData });
    if (!res.ok) return null;
    const { path } = await res.json();
    return path;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("lütfen bir başlık girin", "error");
      return;
    }
    setSaving(true);
    try {
      const body = { title, content, duration, price, format, imagePath, isPublished };
      const url = isEditing ? `/api/trainings/${training.id}` : "/api/trainings";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showToast(isEditing ? "eğitim güncellendi" : "eğitim eklendi", "success");
      onSaved();
    } catch {
      showToast("kaydedilemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!training) return;
    if (!confirm("Bu eğitimi silmek istediğinize emin misiniz?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/trainings/${training.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("eğitim silindi", "success");
      onSaved();
    } catch {
      showToast("silinemedi", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">
            {isEditing ? "eğitimi düzenle" : "yeni eğitim ekle"}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Cover */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Kapak Görseli</label>
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
                  <span className="text-xs text-on-surface-variant lowercase">görsel yüklemek için tıklayın</span>
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
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Ad</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
              placeholder="örn: akrilik teknikleri"
            />
          </div>

          {/* Content (rich text) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">İçerik</label>
            <RichTextEditor value={content} onChange={setContent} placeholder="ne öğretilecek, kimler için uygun..." />
          </div>

          {/* Duration + Price */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Süre</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
                placeholder="örn: 4 hafta / 90 dk"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Fiyat</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
                placeholder="örn: 2.500 tl"
              />
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Format</label>
            <input
              type="text"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
              placeholder="örn: birebir online ders"
            />
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-on-surface lowercase">yayında (site ziyaretçileri görür)</span>
          </label>

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
