"use client";

import { useState, useEffect } from "react";
import { showToast } from "./toast";
import { ArtworkSelector } from "@/components/collection/artwork-selector";
import type { Artwork } from "@/components/artwork/artwork-card";

type Collection = {
  id: string;
  title: string;
  slug: string;
  description: string;
  templateType: "grid" | "showcase" | "challenge";
  metadata: string;
  isPublished: boolean;
  artworkCount?: number;
};

type CollectionManagerModalProps = {
  onClose: () => void;
};

export function CollectionManagerModal({ onClose }: CollectionManagerModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch {
      showToast("koleksiyonlar yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu koleksiyonu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("koleksiyon silindi", "success");
      fetchCollections();
    } catch {
      showToast("silinemedi", "error");
    }
  }

  const templateLabels: Record<string, string> = {
    grid: "ızgara",
    showcase: "vitrin",
    challenge: "meydan okuma",
  };

  if (editingCollection || creating) {
    return (
      <CollectionFormView
        collection={editingCollection}
        onClose={onClose}
        onBack={() => {
          setEditingCollection(null);
          setCreating(false);
          fetchCollections();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">koleksiyonlar</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreating(true)}
              className="bg-primary text-on-primary px-4 py-2 text-sm font-bold lowercase tracking-tight hover:bg-primary-dim transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              yeni koleksiyon
            </button>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
            </div>
          ) : collections.length === 0 ? (
            <p className="text-center text-on-surface-variant py-12 lowercase">henüz koleksiyon yok</p>
          ) : (
            <div className="space-y-4">
              {collections.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-4 border border-surface-container-highest hover:bg-surface-container-low transition-colors cursor-pointer"
                  onClick={() => setEditingCollection(col)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-on-surface lowercase">{col.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-highest px-2 py-0.5 text-on-surface-variant">
                        {templateLabels[col.templateType] ?? col.templateType}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${col.isPublished ? "bg-primary/10 text-primary" : "bg-outline/10 text-outline"}`}>
                        {col.isPublished ? "yayında" : "taslak"}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 lowercase">{col.description || "açıklama yok"}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(col.id);
                    }}
                    className="text-on-surface-variant hover:text-error transition-colors ml-4"
                    aria-label="Sil"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type CollectionArtworkEntry = {
  artworkId: string;
  sortOrder: number;
  dayNumber: number | null;
};

function CollectionFormView({
  collection,
  onClose,
  onBack,
}: {
  collection: Collection | null;
  onClose: () => void;
  onBack: () => void;
}) {
  const isEdit = !!collection;
  const [title, setTitle] = useState(collection?.title ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [templateType, setTemplateType] = useState<"grid" | "showcase" | "challenge">(collection?.templateType ?? "grid");
  const [isPublished, setIsPublished] = useState(collection?.isPublished ?? false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [artworkEntries, setArtworkEntries] = useState<CollectionArtworkEntry[]>([]);
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingArtworks, setLoadingArtworks] = useState(true);

  useEffect(() => {
    fetch("/api/artworks")
      .then((r) => r.json())
      .then((data) => {
        setAllArtworks(Array.isArray(data) ? data : []);
        setLoadingArtworks(false);
      });

    if (collection) {
      fetch(`/api/collections/${collection.id}/artworks`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const ids = data.map((d: any) => d.artworkId);
            setSelectedIds(ids);
            setArtworkEntries(
              data.map((d: any, i: number) => ({
                artworkId: d.artworkId,
                sortOrder: d.sortOrder ?? i,
                dayNumber: d.dayNumber ?? null,
              }))
            );
          }
        });
    }
  }, [collection]);

  useEffect(() => {
    if (!isEdit) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9ğüşıöç\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim()
      );
    }
  }, [title, isEdit]);

  function handleSelectionChange(ids: string[]) {
    setSelectedIds(ids);
    const newEntries = ids.map((id, i) => {
      const existing = artworkEntries.find((e) => e.artworkId === id);
      return existing ?? { artworkId: id, sortOrder: i, dayNumber: null };
    });
    setArtworkEntries(newEntries);
  }

  function moveArtwork(index: number, direction: -1 | 1) {
    const newEntries = [...artworkEntries];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newEntries.length) return;
    [newEntries[index], newEntries[targetIndex]] = [newEntries[targetIndex], newEntries[index]];
    newEntries.forEach((e, i) => (e.sortOrder = i));
    setArtworkEntries(newEntries);
    setSelectedIds(newEntries.map((e) => e.artworkId));
  }

  function setDayNumber(artworkId: string, dayNumber: number | null) {
    setArtworkEntries((prev) =>
      prev.map((e) => (e.artworkId === artworkId ? { ...e, dayNumber } : e))
    );
  }

  async function handleSave() {
    if (!title.trim() || !slug.trim()) {
      showToast("başlık ve slug gerekli", "error");
      return;
    }
    setSaving(true);
    try {
      let collectionId = collection?.id;

      const body = {
        title,
        slug,
        description,
        templateType,
        metadata: JSON.stringify({}),
        isPublished,
      };

      if (isEdit) {
        const res = await fetch(`/api/collections/${collectionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        collectionId = data.id;
      }

      const artworksBody = artworkEntries.map((e, i) => ({
        artworkId: e.artworkId,
        sortOrder: i,
        dayNumber: e.dayNumber,
      }));

      await fetch(`/api/collections/${collectionId}/artworks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artworksBody),
      });

      showToast(isEdit ? "koleksiyon güncellendi" : "koleksiyon oluşturuldu", "success");
      onBack();
    } catch {
      showToast("kaydedilemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  const templateOptions = [
    { value: "grid" as const, icon: "grid_view", label: "ızgara" },
    { value: "showcase" as const, icon: "auto_awesome", label: "vitrin" },
    { value: "challenge" as const, icon: "emoji_events", label: "meydan okuma" },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h2 className="text-2xl font-bold text-on-surface lowercase">
              {isEdit ? "koleksiyonu düzenle" : "yeni koleksiyon"}
            </h2>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all"
              placeholder="koleksiyon adı"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">slug (url)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all font-mono text-sm"
              placeholder="koleksiyon-adi"
            />
            <p className="text-[10px] text-on-surface-variant mt-1">/koleksiyon/{slug || "..."}</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase transition-all resize-none"
              placeholder="koleksiyon açıklaması"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-3">şablon</label>
            <div className="grid grid-cols-3 gap-3">
              {templateOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTemplateType(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 border-2 transition-colors ${
                    templateType === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-surface-container-highest hover:border-outline-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                  <span className="text-xs font-bold lowercase">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary">yayın durumu</label>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold lowercase transition-colors ${
                isPublished ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {isPublished ? "yayında" : "taslak"}
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-3">eserler</label>
            {loadingArtworks ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
              </div>
            ) : (
              <>
                <ArtworkSelector
                  allArtworks={allArtworks}
                  selectedIds={selectedIds}
                  onChange={handleSelectionChange}
                />

                {artworkEntries.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">sıralama</p>
                    {artworkEntries.map((entry, index) => {
                      const artwork = allArtworks.find((a) => a.id === entry.artworkId);
                      if (!artwork) return null;
                      return (
                        <div key={entry.artworkId} className="flex items-center gap-3 p-2 bg-surface-container-low">
                          <img src={artwork.imagePath} alt={artwork.title} className="w-10 h-10 object-cover" />
                          <span className="flex-1 text-sm text-on-surface lowercase truncate">{artwork.title}</span>
                          {templateType === "challenge" && (
                            <input
                              type="number"
                              value={entry.dayNumber ?? ""}
                              onChange={(e) => setDayNumber(entry.artworkId, e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="gün"
                              className="w-16 text-center text-sm border border-outline-variant px-2 py-1"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => moveArtwork(index, -1)}
                            disabled={index === 0}
                            className="text-on-surface-variant hover:text-primary disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-base">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveArtwork(index, 1)}
                            disabled={index === artworkEntries.length - 1}
                            className="text-on-surface-variant hover:text-primary disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-base">arrow_downward</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50"
            >
              {saving ? "kaydediliyor..." : "kaydet"}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="border border-outline-variant text-on-surface px-8 py-3 font-bold tracking-tight hover:bg-surface-container transition-all duration-300"
            >
              geri
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
