"use client";

import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { TemplatePicker } from "@/components/collection/template-picker";
import type { Artwork } from "@/components/artwork/artwork-card";

type CollectionPageClientProps = {
  collectionId: string;
  templateType: "grid" | "showcase" | "challenge";
  artworkIds: string[];
  allArtworks: Artwork[];
};

export function CollectionAdminControls({
  collectionId,
  templateType,
  artworkIds,
  allArtworks,
}: CollectionPageClientProps) {
  const { isAdmin } = useAdmin();
  const [showPicker, setShowPicker] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setShowPicker(true)}
        className="fixed bottom-8 right-8 z-50 bg-primary text-on-primary px-6 py-4 font-bold shadow-xl hover:bg-primary-dim transition-all duration-300 flex items-center gap-3"
      >
        <span className="material-symbols-outlined">edit</span>
        Koleksiyonu Düzenle
      </button>
      {showPicker && (
        <TemplatePicker
          allArtworks={allArtworks}
          collectionId={collectionId}
          currentTemplate={templateType}
          currentArtworkIds={artworkIds}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
