"use client";

import { useState } from "react";
import { HoneypotField } from "./honeypot-field";

export function QuestionForm() {
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    if (formData.get("_honey")) return;

    if (!question.trim() || !email.trim()) {
      setError("lütfen tüm alanları doldurun");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "question",
          data: { question, email },
        }),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setQuestion("");
      setEmail("");
    } catch {
      setError("gönderilemedi, lütfen tekrar deneyin");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-secondary/5 p-8 border-l-4 border-secondary">
        <p className="text-primary font-bold text-xl lowercase">
          sorunuz iletildi, teşekkürler!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 relative">
      <HoneypotField />
      <div className="bg-secondary/5 p-8 border-l-4 border-secondary">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          rows={4}
          className="w-full bg-transparent border-0 focus:ring-0 p-0 text-xl text-on-surface placeholder:text-on-surface/30 lowercase resize-none mb-4"
          placeholder="merak ettiğiniz o şey..."
        />
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white border border-outline-variant focus:border-secondary focus:ring-0 px-6 py-4 text-on-surface placeholder:text-on-surface/30 lowercase"
            placeholder="yanıt için e-postanız"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto font-bold lowercase hover:bg-secondary/90 transition-all px-8 py-4 whitespace-nowrap bg-secondary-fixed text-on-secondary-fixed disabled:opacity-50"
          >
            {submitting ? "gönderiliyor..." : "sor gitsin"}
          </button>
        </div>
        {error && <p className="text-error text-sm font-medium mt-3">{error}</p>}
      </div>
    </form>
  );
}
