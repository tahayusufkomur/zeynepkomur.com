"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { InlineEdit } from "@/components/admin/inline-edit";
import { showToast } from "@/components/admin/toast";
import type { NavItem } from "@/lib/get-navbar-content";

type NavbarProps = {
  currentPage: string;
  onNewsletterClick?: () => void;
  navItems?: NavItem[];
};

const DEFAULT_ITEMS: NavItem[] = [
  { key: "anasayfa", href: "/", label: "anasayfa", page: "anasayfa", hidden: false },
  { key: "galeri", href: "/galeri", label: "galeri", page: "galeri", hidden: false },
  { key: "hakkinda", href: "/hakkinda", label: "hakkında", page: "hakkinda", hidden: false },
  { key: "iletisim", href: "/iletisim", label: "iletişim", page: "iletisim", hidden: false },
];

export function Navbar({ currentPage, onNewsletterClick, navItems }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isEditing } = useAdmin();
  const items = navItems ?? DEFAULT_ITEMS;

  const visibleItems = isEditing ? items : items.filter((i) => !i.hidden);

  async function toggleHidden(key: string, currentlyHidden: boolean) {
    try {
      await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: "navbar",
          sectionKey: `${key}_hidden`,
          content: currentlyHidden ? "false" : "true",
        }),
      });
      showToast(currentlyHidden ? "link gösterildi" : "link gizlendi", "success");
      window.location.reload();
    } catch {
      showToast("kaydedilemedi", "error");
    }
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center w-full px-8 py-6 max-w-full">
      <Link
        href="/"
        className="font-bold text-on-surface lowercase font-body tracking-tight text-4xl"
      >
        by zeynep kömür
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center space-x-12">
        {visibleItems.map((link) => {
          const isActive = currentPage === link.page;
          return (
            <div key={link.key} className="flex items-center gap-1 relative">
              {isEditing ? (
                <InlineEdit
                  pageSlug="navbar"
                  sectionKey={`${link.key}_label`}
                  initialContent={link.label}
                  as="span"
                  className={
                    isActive
                      ? "text-primary font-bold border-b-2 border-secondary-container pb-1 lowercase font-body tracking-tight"
                      : "text-on-surface-variant hover:text-primary transition-colors duration-300 lowercase font-body tracking-tight"
                  }
                />
              ) : (
                <Link
                  href={link.href}
                  className={
                    isActive
                      ? "text-primary font-bold border-b-2 border-secondary-container pb-1 lowercase font-body tracking-tight"
                      : "text-on-surface-variant hover:text-primary transition-colors duration-300 lowercase font-body tracking-tight"
                  }
                  style={isActive ? { borderColor: "#ffd709" } : undefined}
                >
                  {link.label}
                </Link>
              )}
              {isEditing && (
                <button
                  onClick={() => toggleHidden(link.key, link.hidden)}
                  className={`ml-1 w-5 h-5 flex items-center justify-center rounded-full text-xs transition-colors ${
                    link.hidden
                      ? "bg-error/20 text-error"
                      : "bg-primary/10 text-primary"
                  }`}
                  title={link.hidden ? "göster" : "gizle"}
                >
                  <span className="material-symbols-outlined text-xs">
                    {link.hidden ? "visibility_off" : "visibility"}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onNewsletterClick}
          className="bg-primary text-on-primary px-6 py-2 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 active:scale-95 hidden md:block"
        >
          KULÜBE KATIL
        </button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-on-surface"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menüyü aç"
        >
          <span className="material-symbols-outlined text-3xl">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-t border-surface-container flex flex-col items-center gap-6 py-8 md:hidden z-50">
          {visibleItems.map((link) => {
            const isActive = currentPage === link.page;
            return (
              <Link
                key={link.page}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={
                  isActive
                    ? "text-primary font-bold border-b-2 pb-1 lowercase font-body tracking-tight text-lg"
                    : "text-on-surface-variant hover:text-primary transition-colors duration-300 lowercase font-body tracking-tight text-lg"
                }
                style={isActive ? { borderColor: "#ffd709" } : undefined}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => {
              setMobileOpen(false);
              onNewsletterClick?.();
            }}
            className="bg-primary text-on-primary px-6 py-2 font-bold tracking-tight hover:bg-primary-dim transition-all duration-300 active:scale-95"
          >
            KULÜBE KATIL
          </button>
        </div>
      )}
    </nav>
  );
}
