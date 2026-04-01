"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error";
let showToastFn: ((message: string, type: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "success") {
  showToastFn?.(message, type);
}

export function ToastProvider() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
    showToastFn = (message, type) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };
    return () => {
      showToastFn = null;
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-8 right-8 z-[200] px-6 py-3 shadow-lg text-sm font-bold lowercase ${
        toast.type === "success"
          ? "bg-primary text-on-primary"
          : "bg-error text-on-error"
      }`}
    >
      {toast.message}
    </div>
  );
}
