"use client";

import { useState, useEffect } from "react";

interface FallbackImageProps {
  src: string;
  alt: string;
  fallbackSrc: string;
  className?: string;
}

export function FallbackImage({ src, alt, fallbackSrc, className }: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  // Sync when src prop changes (e.g. after admin uploads a new image)
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <img
      alt={alt}
      className={className}
      src={imgSrc}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
