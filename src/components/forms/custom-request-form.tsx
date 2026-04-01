"use client";

import { useState, useRef } from "react";
import { HoneypotField } from "./honeypot-field";

export function CustomRequestForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "forms");
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { path } = await res.json();
      setFilePath(path);
      setFileName(file.name);
    } catch {
      setError("dosya yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    if (formData.get("_honey")) return;

    if (!firstName.trim() || !email.trim() || !description.trim()) {
      setError("lütfen gerekli alanları doldurun");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "custom_request",
          data: {
            firstName,
            lastName,
            email,
            description,
            attachmentPath: filePath || null,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setDescription("");
      setFilePath("");
      setFileName("");
    } catch {
      setError("gönderilemedi, lütfen tekrar deneyin");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-primary font-bold text-xl lowercase p-8">
        isteğiniz iletildi, en kısa sürede dönüş yapacağız!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
      <HoneypotField />

      {/* Two-column name fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-petrol-blue mb-2">
            Adınız
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-petrol-blue px-0 py-3 text-on-surface placeholder:text-outline-variant transition-all lowercase"
            placeholder="ör. zeynep"
          />
        </div>
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-petrol-blue mb-2">
            Soyadınız
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-petrol-blue px-0 py-3 text-on-surface placeholder:text-outline-variant transition-all lowercase"
            placeholder="ör. kömür"
          />
        </div>
      </div>

      {/* Email */}
      <div className="relative">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-petrol-blue mb-2">
          E-posta Adresiniz
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-petrol-blue px-0 py-3 text-on-surface placeholder:text-outline-variant transition-all lowercase"
          placeholder="merhaba@zeyn.art"
        />
      </div>

      {/* File upload zone */}
      <div className="relative">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-warm-orange mb-2">
          Mekanınızın Fotoğrafı
        </label>
        <div
          className="group relative flex flex-col items-center justify-center w-full h-40 bg-surface-container-low border-2 border-dashed border-outline-variant hover:border-warm-orange transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          {fileName ? (
            <span className="text-sm text-on-surface lowercase">{fileName}</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-warm-orange mb-2">
                {uploading ? "progress_activity" : "upload_file"}
              </span>
              <span className="text-xs text-on-surface-variant lowercase">
                dosyayı sürükleyin veya{" "}
                <span className="text-warm-orange font-bold underline">seçin</span>
              </span>
            </>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="material-symbols-outlined text-warm-orange text-4xl animate-spin">
                progress_activity
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Description */}
      <div className="relative">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-petrol-blue mb-2">
          İstediğiniz Resme Dair Açıklama
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-petrol-blue px-0 py-3 text-on-surface placeholder:text-outline-variant transition-all lowercase resize-none"
          placeholder="renk paleti, boyutlar ve hayalinizdeki atmosfer..."
        />
      </div>

      {error && <p className="text-error text-sm font-medium">{error}</p>}

      {/* Submit button */}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full bg-warm-yellow text-on-secondary-container font-bold py-6 text-lg tracking-tighter lowercase flex justify-between items-center px-10 group hover:bg-petrol-blue hover:text-white transition-all duration-500 disabled:opacity-50"
      >
        <span>{submitting ? "gönderiliyor..." : "isteği gönder"}</span>
        <span className="material-symbols-outlined transition-transform duration-300 group-hover:translate-x-2">
          arrow_right_alt
        </span>
      </button>
    </form>
  );
}
