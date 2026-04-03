"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/admin/toast";
import type { Artwork } from "@/components/artwork/artwork-card";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export function HeroPickerModal({ onClose, onSaved }: Props) {
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [artRes, heroRes] = await Promise.all([
        fetch("/api/artworks"),
        fetch("/api/home/hero"),
      ]);
      const arts = await artRes.json();
      const { artworkIds } = await heroRes.json();
      setAllArtworks(arts);
      setSelected(artworkIds || []);
      setLoading(false);
    }
    load();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === selected.length - 1) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (selected.length !== 3) {
      showToast("lütfen tam 3 eser seçin", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/home/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkIds: selected }),
      });
      if (!res.ok) throw new Error();
      showToast("ana sayfa görselleri güncellendi", "success");
      onSaved();
    } catch {
      showToast("kaydedilemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  const selectedArtworks = selected.map((id) => allArtworks.find((a) => a.id === id)).filter(Boolean) as Artwork[];
  const slotLabels = ["ana görsel", "dikey kart", "alt kart"];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">ana sayfa görselleri</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          </div>
        ) : (
          <>
            {/* Selected slots */}
            <div className="px-8 py-6 border-b border-surface-container">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">seçili eserler ({selected.length}/3)</p>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((slot) => {
                  const art = selectedArtworks[slot];
                  return (
                    <div key={slot} className="aspect-[4/3] bg-surface-container-low border-2 border-dashed border-outline-variant relative overflow-hidden">
                      {art ? (
                        <>
                          <img src={art.imagePath} alt={art.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                            {slot > 0 && (
                              <button onClick={() => moveUp(slot)} className="bg-white w-7 h-7 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                              </button>
                            )}
                            <button onClick={() => toggle(art.id)} className="bg-white text-error w-7 h-7 flex items-center justify-center">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                            {slot < selected.length - 1 && (
                              <button onClick={() => moveDown(slot)} className="bg-white w-7 h-7 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-2 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">{slotLabels[slot]}</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-outline-variant">{slotLabels[slot]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All artworks grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {allArtworks.map((art) => {
                  const isSelected = selected.includes(art.id);
                  return (
                    <button key={art.id} onClick={() => toggle(art.id)} className={`aspect-square overflow-hidden relative border-2 transition-colors ${isSelected ? "border-primary" : "border-transparent hover:border-outline-variant"}`}>
                      <img src={art.imagePath} alt={art.title} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute top-1 left-1 bg-primary text-on-primary w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                          {selected.indexOf(art.id) + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-4 px-8 py-6 border-t border-surface-container">
          <button onClick={handleSave} disabled={saving || selected.length !== 3} className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50">
            {saving ? "kaydediliyor..." : "kaydet"}
          </button>
          <button onClick={onClose} className="border border-outline-variant text-on-surface px-8 py-3 font-bold tracking-tight hover:bg-surface-container transition-all duration-300">
            iptal
          </button>
        </div>
      </div>
    </div>
  );
}
