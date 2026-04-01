"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useState, useRef } from "react";
import { showToast } from "./toast";

type ImageUploadProps = {
  currentSrc: string;
  category?: "artworks" | "forms" | "pages";
  onUpload: (newPath: string) => void;
  className?: string;
  children: React.ReactNode;
};

export function ImageUpload({
  currentSrc,
  category = "artworks",
  onUpload,
  className = "",
  children,
}: ImageUploadProps) {
  const { isAdmin } = useAdmin();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return <div className={className}>{children}</div>;

  return (
    <div className={`${className} relative group`}>
      {children}
      <div
        className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <span className="material-symbols-outlined text-white text-4xl animate-spin">
            progress_activity
          </span>
        ) : (
          <span className="material-symbols-outlined text-white text-4xl">
            upload
          </span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const { path } = await res.json();
      onUpload(path);
      showToast("görsel yüklendi", "success");
    } catch (err: any) {
      showToast(err.message || "yükleme başarısız", "error");
    } finally {
      setUploading(false);
    }
  }
}
