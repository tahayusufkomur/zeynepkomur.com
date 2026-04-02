"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { NewsletterModal } from "@/components/newsletter-modal";
import type { NavItem } from "@/lib/get-navbar-content";

export function HomeClient({ children, navItems }: { children: React.ReactNode; navItems?: NavItem[] }) {
  const [showNewsletter, setShowNewsletter] = useState(false);

  return (
    <>
      <Navbar
        currentPage="anasayfa"
        onNewsletterClick={() => setShowNewsletter(true)}
        navItems={navItems}
      />
      {children}
      {showNewsletter && (
        <NewsletterModal onClose={() => setShowNewsletter(false)} />
      )}
    </>
  );
}
