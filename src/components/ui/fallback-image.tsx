"use client";

import { useState } from "react";

interface FallbackImageProps {
  src: string;
  alt: string;
  fallbackSrc: string;
  className?: string;
}

export function FallbackImage({ src, alt, fallbackSrc, className }: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      alt={alt}
      className={className}
      src={imgSrc}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
