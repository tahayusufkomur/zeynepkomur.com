"use client";

import { useState } from "react";
import { HoneypotField } from "./honeypot-field";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Honeypot check
    const formData = new FormData(e.currentTarget);
    if (formData.get("_honey")) return;

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("lütfen tüm alanları doldurun");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "contact",
          data: { name, email, message },
        }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setError("gönderilemedi, lütfen tekrar deneyin");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-primary font-bold text-xl lowercase">
        mesajınız iletildi, teşekkürler!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12 relative">
      <HoneypotField />
      <div className="relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-4 text-xl text-on-surface placeholder:text-on-surface/30 lowercase transition-all"
          placeholder="isminiz nedir?"
        />
      </div>
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-4 text-xl text-on-surface placeholder:text-on-surface/30 lowercase transition-all"
          placeholder="e-posta adresiniz?"
        />
      </div>
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 px-0 py-4 text-xl text-on-surface placeholder:text-on-surface/30 lowercase transition-all resize-none"
          placeholder="projenizden kısaca bahsedin..."
        />
      </div>
      {error && <p className="text-error text-sm font-medium">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-4 text-primary font-bold text-2xl lowercase hover:gap-6 transition-all disabled:opacity-50"
      >
        {submitting ? "gönderiliyor..." : "gönder"}{" "}
        <span className="material-symbols-outlined text-3xl">arrow_forward</span>
      </button>
    </form>
  );
}
