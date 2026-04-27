"use client";

import { useState } from "react";
import { ImageUpload } from "./image-upload";
import { FallbackImage } from "@/components/ui/fallback-image";

type Props = {
  pageSlug: string;
  sectionKey: string;
  initialSrc: string;
  alt: string;
  className?: string;
  imgClassName?: string;
};

const EMPTY_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23e8e6ff'/%3E%3Cg fill='%23a9a9d7'%3E%3Crect x='250' y='230' width='100' height='80'/%3E%3Ccircle cx='330' cy='260' r='12'/%3E%3Cpath d='M250 310 l40 -40 30 20 30 -30 0 50 z'/%3E%3C/g%3E%3C/svg%3E";

export function PageImageSlot({
  pageSlug,
  sectionKey,
  initialSrc,
  alt,
  className = "",
  imgClassName = "w-full h-full object-cover",
}: Props) {
  const [src, setSrc] = useState(initialSrc);

  async function handleUpload(newPath: string) {
    setSrc(newPath);
    await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageSlug, sectionKey, content: newPath }),
    });
  }

  return (
    <div className={className}>
      <ImageUpload currentSrc={src} category="pages" onUpload={handleUpload} className="w-full h-full">
        <FallbackImage alt={alt} className={imgClassName} src={src || EMPTY_PLACEHOLDER} fallbackSrc={EMPTY_PLACEHOLDER} />
      </ImageUpload>
    </div>
  );
}
