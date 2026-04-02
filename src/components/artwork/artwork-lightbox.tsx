"use client";

import { useState, useEffect, useCallback } from "react";
import type { Artwork } from "./artwork-card";

type ArtworkLightboxProps = {
  artwork: Artwork;
  onClose: () => void;
};

export function ArtworkLightbox({ artwork, onClose }: ArtworkLightboxProps) {
  const allImages = [artwork.imagePath, ...artwork.images.map((img) => img.imagePath)];
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultiple = allImages.length > 1;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 text-white/70 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>

      {/* Main image */}
      <div
        className="relative flex items-center justify-center w-full h-full p-16 md:p-24"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous button */}
        {hasMultiple && (
          <button
            onClick={goPrev}
            className="absolute left-4 md:left-8 z-10 text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-5xl">chevron_left</span>
          </button>
        )}

        <img
          src={allImages[currentIndex]}
          alt={`${artwork.title} - ${currentIndex + 1}/${allImages.length}`}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />

        {/* Next button */}
        {hasMultiple && (
          <button
            onClick={goNext}
            className="absolute right-4 md:right-8 z-10 text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-5xl">chevron_right</span>
          </button>
        )}
      </div>

      {/* Bottom bar: info + thumbnails */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-8 pb-8 pt-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
          {/* Artwork info */}
          <div className="text-center">
            <h3 className="text-white text-lg font-bold lowercase">{artwork.title}</h3>
            <p className="text-white/60 text-sm lowercase">{artwork.description}</p>
          </div>

          {/* Thumbnail strip */}
          {hasMultiple && (
            <div className="flex items-center gap-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-12 h-12 overflow-hidden transition-all ${
                    i === currentIndex
                      ? "ring-2 ring-white opacity-100 scale-110"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${artwork.title} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              <span className="text-white/40 text-xs font-bold ml-2">
                {currentIndex + 1} / {allImages.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
