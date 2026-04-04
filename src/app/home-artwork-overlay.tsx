"use client";

import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { ArtworkFormModal } from "@/components/artwork/artwork-form-modal";
import type { Artwork } from "@/components/artwork/artwork-card";
import { useRouter } from "next/navigation";
import Link from "next/link";

type HomeArtworkOverlayProps = {
  artwork: Artwork | null;
  children: React.ReactNode;
  className?: string;
};

export function HomeArtworkOverlay({ artwork, children, className = "" }: HomeArtworkOverlayProps) {
  const { isEditing } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  if (!isEditing || !artwork) {
    if (artwork) {
      return <Link href={`/eser/${artwork.slug}`} className={`block ${className}`}>{children}</Link>;
    }
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <div
        className={`${className} cursor-pointer outline outline-1 outline-primary/30 hover:outline-2 hover:outline-primary/50 group/edit relative`}
        onClick={() => setShowModal(true)}
      >
        {children}
        <span className="absolute -top-2.5 -right-2.5 z-20 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-70 group-hover/edit:opacity-100 transition-opacity material-symbols-outlined">
          edit
        </span>
      </div>
      {showModal && (
        <ArtworkFormModal
          artwork={artwork}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
