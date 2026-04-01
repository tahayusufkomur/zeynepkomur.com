"use client";

import Link from "next/link";
import { useState } from "react";

type NavbarProps = {
  currentPage: string;
  onNewsletterClick?: () => void;
};

const navLinks = [
  { href: "/", label: "anasayfa", page: "anasayfa" },
  { href: "/galeri", label: "galeri", page: "galeri" },
  { href: "/hakkinda", label: "hakkında", page: "hakkinda" },
  { href: "/iletisim", label: "iletişim", page: "iletisim" },
];

export function Navbar({ currentPage, onNewsletterClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center w-full px-8 py-6 max-w-full">
      <Link
        href="/"
        className="font-bold text-on-surface lowercase font-body tracking-tight text-4xl"
      >
        arada zeynep kömür
      </Link>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center space-x-12">
        {navLinks.map((link) => {
          const isActive = currentPage === link.page;
          return (
            <Link
              key={link.page}
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
          {navLinks.map((link) => {
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
