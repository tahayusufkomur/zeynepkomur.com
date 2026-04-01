"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { NewsletterModal } from "@/components/newsletter-modal";

export function HomeClient({ children }: { children: React.ReactNode }) {
  const [showNewsletter, setShowNewsletter] = useState(false);

  return (
    <>
      <Navbar
        currentPage="anasayfa"
        onNewsletterClick={() => setShowNewsletter(true)}
      />
      {children}
      {showNewsletter && (
        <NewsletterModal onClose={() => setShowNewsletter(false)} />
      )}
    </>
  );
}
