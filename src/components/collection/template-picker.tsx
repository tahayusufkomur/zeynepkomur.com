"use client";

import { useState } from "react";
import { ArtworkSelector } from "./artwork-selector";
import type { Artwork } from "@/components/artwork/artwork-card";

type TemplatePicker = "grid" | "showcase" | "challenge";

type TemplatePickerProps = {
  allArtworks: Artwork[];
  collectionId: string;
  currentTemplate: TemplatePicker;
  currentArtworkIds: string[];
  onClose?: () => void;
};

const TEMPLATE_OPTIONS: { value: TemplatePicker; label: string; desc: string }[] = [
  { value: "grid", label: "grid", desc: "klasik ızgara düzeni" },
  { value: "showcase", label: "showcase", desc: "hero + bento düzeni" },
  { value: "challenge", label: "meydan okuma", desc: "numaralı günlük eserler" },
];

export function TemplatePicker({
  allArtworks,
  collectionId,
  currentTemplate,
  currentArtworkIds,
  onClose,
}: TemplatePickerProps) {
  const [template, setTemplate] = useState<TemplatePicker>(currentTemplate);
  const [selectedIds, setSelectedIds] = useState<string[]>(currentArtworkIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType: template, artworkIds: selectedIds }),
      });
      if (!res.ok) throw new Error();
      onClose?.();
      window.location.reload();
    } catch {
      setError("kaydedilemedi, tekrar deneyin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-surface-container">
          <h2 className="text-xl font-bold text-on-surface lowercase tracking-tighter">
            koleksiyon düzenle
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Template selection */}
        <div className="p-6 border-b border-surface-container">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            şablon seç
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTemplate(opt.value)}
                className={`p-4 border-2 text-left transition-colors ${
                  template === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant hover:border-primary/40"
                }`}
              >
                <div className="font-bold text-sm text-on-surface lowercase">
                  {opt.label}
                </div>
                <div className="text-xs text-on-surface-variant lowercase mt-1">
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Artwork selector */}
        <div className="p-6 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            eserleri seç
          </p>
          <ArtworkSelector
            allArtworks={allArtworks}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-container flex justify-between items-center">
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-outline-variant text-on-surface-variant hover:text-on-surface lowercase text-sm font-semibold"
            >
              iptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary text-on-primary font-bold lowercase text-sm hover:bg-primary-dim transition-colors disabled:opacity-50"
            >
              {saving ? "kaydediliyor..." : "kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
