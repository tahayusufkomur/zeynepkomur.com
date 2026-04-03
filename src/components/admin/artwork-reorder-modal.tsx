"use client";

import { useState } from "react";
import { showToast } from "@/components/admin/toast";
import type { Artwork } from "@/components/artwork/artwork-card";

type Props = {
  artworks: Artwork[];
  onClose: () => void;
  onSaved: () => void;
};

export function ArtworkReorderModal({ artworks: initial, onClose, onSaved }: Props) {
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);

  function moveUp(index: number) {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = items.map((item, i) => ({ id: item.id, sortOrder: i }));
      const res = await fetch("/api/artworks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showToast("sıralama güncellendi", "success");
      onSaved();
    } catch {
      showToast("sıralama güncellenemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-8 py-6 border-b border-surface-container">
          <h2 className="text-2xl font-bold text-on-surface lowercase">eserleri sırala</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container transition-colors">
              <img src={item.imagePath} alt="" className="w-12 h-12 object-cover flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-on-surface lowercase truncate">{item.title}</span>
              <div className="flex gap-1">
                <button onClick={() => moveUp(i)} disabled={i === 0} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors">
                  <span className="material-symbols-outlined text-lg">arrow_upward</span>
                </button>
                <button onClick={() => moveDown(i)} disabled={i === items.length - 1} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 transition-colors">
                  <span className="material-symbols-outlined text-lg">arrow_downward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 px-8 py-6 border-t border-surface-container">
          <button onClick={handleSave} disabled={saving} className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50">
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
