"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { FallbackImage } from "@/components/ui/fallback-image";

export function OzelIstekImage({ initialSrc }: { initialSrc: string }) {
  const [src, setSrc] = useState(initialSrc);

  async function handleUpload(newPath: string) {
    setSrc(newPath);
    await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageSlug: "ozel-istek", sectionKey: "art_image", content: newPath }),
    });
  }

  return (
    <ImageUpload currentSrc={src} category="pages" onUpload={handleUpload}>
      <FallbackImage
        alt="modern sanat illüstrasyonu"
        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
        src={src}
        fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23e8e6ff'/%3E%3Crect x='50' y='50' width='300' height='300' fill='%23004be3' opacity='0.2'/%3E%3C/svg%3E"
      />
    </ImageUpload>
  );
}
