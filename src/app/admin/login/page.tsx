"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("geçersiz e-posta veya şifre");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8 p-12 bg-white shadow-sm">
        <h1 className="text-3xl font-bold tracking-tighter text-on-surface lowercase">yönetici girişi</h1>
        {error && <p className="text-error text-sm">{error}</p>}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">e-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface lowercase"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary px-0 py-3 text-on-surface"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-bold tracking-tight lowercase hover:bg-primary-dim transition-all"
        >
          giriş yap
        </button>
      </form>
    </div>
  );
}
