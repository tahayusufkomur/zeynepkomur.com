"use client";

import { useAdmin } from "@/hooks/use-admin";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminToolbar() {
  const { isAdmin } = useAdmin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/submissions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data))
          setUnreadCount(data.filter((s: any) => !s.isRead).length);
      });
    fetch("/api/newsletter/count")
      .then((r) => r.json())
      .then((data) => setSubscriberCount(data.count || 0));
  }, [isAdmin, pathname]);

  if (!isAdmin) return null;

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-[200] w-10 h-10 bg-inverse-surface text-inverse-on-surface flex items-center justify-center shadow-lg hover:bg-primary transition-colors"
        aria-label="Admin menü"
      >
        <span className="material-symbols-outlined text-xl">
          {open ? "close" : "admin_panel_settings"}
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[150] backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-inverse-surface text-inverse-on-surface z-[200] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-inverse-on-surface/60">
              admin panel
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-inverse-on-surface/60 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          <p className="text-inverse-on-surface/40 text-xs lowercase truncate">
            {pathname}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-inverse-on-surface/40 px-2 mb-2">
              sayfalar
            </p>
            <NavItem href="/" icon="home" label="anasayfa" current={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/galeri" icon="gallery_thumbnail" label="galeri" current={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/hakkinda" icon="person" label="hakkında" current={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/iletisim" icon="mail" label="iletişim" current={pathname} onClick={() => setOpen(false)} />
            <NavItem href="/ozel-istek" icon="brush" label="özel istek" current={pathname} onClick={() => setOpen(false)} />
          </div>

          <div className="px-4 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-inverse-on-surface/40 px-2 mb-2 mt-4">
              yönetim
            </p>
            <NavItem
              href="/admin/submissions"
              icon="inbox"
              label="gönderiler"
              current={pathname}
              onClick={() => setOpen(false)}
              badge={unreadCount > 0 ? unreadCount : undefined}
            />
          </div>

          {/* Stats */}
          <div className="px-6 mt-4">
            <div className="bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-inverse-on-surface/60 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  bülten aboneleri
                </span>
                <span className="text-sm font-bold">{subscriberCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-inverse-on-surface/60 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">inbox</span>
                  okunmamış
                </span>
                <span className={`text-sm font-bold ${unreadCount > 0 ? "text-error-container" : ""}`}>
                  {unreadCount}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 space-y-3">
          <div className="text-xs text-inverse-on-surface/40 lowercase">
            düzenleme modu aktif
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-error/80 text-inverse-on-surface text-sm font-bold lowercase tracking-tight transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            çıkış yap
          </button>
        </div>
      </div>
    </>
  );
}

function NavItem({
  href,
  icon,
  label,
  current,
  onClick,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  current: string;
  onClick: () => void;
  badge?: number;
}) {
  const isActive = current === href || (href !== "/" && current.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm lowercase tracking-tight transition-colors ${
        isActive
          ? "bg-primary text-on-primary font-bold"
          : "text-inverse-on-surface/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}
