"use client";

import { useState } from "react";

type NewsletterModalProps = {
  onClose: () => void;
};

export function NewsletterModal({ onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("lütfen e-posta adresinizi girin");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });
      if (res.status === 409) {
        setError("zaten kayıtlısınız");
        return;
      }
      if (!res.ok) throw new Error();
      setSuccess(true);
    } catch {
      setError("kaydedilemedi, lütfen tekrar deneyin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Kapat"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="p-10">
          {success ? (
            <div className="text-center space-y-4">
              <span className="material-symbols-outlined text-primary text-5xl">
                check_circle
              </span>
              <h3 className="text-2xl font-bold text-on-surface lowercase">
                başarıyla kaydoldunuz!
              </h3>
              <p className="text-on-surface-variant text-sm lowercase">
                yeni eserlerden ve etkinliklerden haberdar olacaksınız.
              </p>
              <button
                onClick={onClose}
                className="bg-primary text-on-primary px-8 py-3 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 mt-4"
              >
                tamam
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-bold text-on-surface lowercase mb-2">
                kulübe katıl
              </h3>
              <p className="text-on-surface-variant text-sm lowercase mb-8">
                yeni eserler, koleksiyonlar ve özel etkinliklerden ilk sen haberdar ol.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-4 text-lg text-on-surface placeholder:text-on-surface/30 lowercase transition-all"
                    placeholder="e-posta adresiniz"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-4 text-lg text-on-surface placeholder:text-on-surface/30 lowercase transition-all"
                    placeholder="isminiz (isteğe bağlı)"
                  />
                </div>
                {error && (
                  <p className="text-error text-sm font-medium">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-on-primary py-4 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? "kaydediliyor..." : "katıl"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
