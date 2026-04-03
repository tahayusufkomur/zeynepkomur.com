"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useEditMode } from "@/providers/edit-mode-provider";
import { CollectionManagerModal } from "@/components/admin/collection-manager-modal";
import { HeroPickerModal } from "@/components/admin/hero-picker-modal";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminToolbar() {
  const { isAdmin } = useAdmin();
  const { isEditing, setIsEditing } = useEditMode();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [showCollections, setShowCollections] = useState(false);
  const [showHeroPicker, setShowHeroPicker] = useState(false);
  const router = useRouter();

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
      {/* Toggle button — vertically centered */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-1/2 -translate-y-1/2 left-0 z-[200] w-10 h-12 bg-inverse-surface text-inverse-on-surface flex items-center justify-center shadow-lg hover:bg-primary transition-colors"
        aria-label="Admin menü"
      >
        <span className="material-symbols-outlined text-xl">
          {open ? "chevron_left" : "chevron_right"}
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
          <div className="flex items-center justify-between">
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
        </div>

        {/* Edit Mode Toggle */}
        <div className="px-6 py-5 border-b border-white/10">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold lowercase tracking-tight transition-all ${
              isEditing
                ? "bg-primary text-on-primary"
                : "bg-white/10 text-inverse-on-surface hover:bg-white/20"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {isEditing ? "edit_off" : "edit"}
            </span>
            <span className="flex-1 text-left">
              {isEditing ? "düzenleme aktif" : "düzenlemeyi aç"}
            </span>
            <div
              className={`w-10 h-5 rounded-full relative transition-colors ${
                isEditing ? "bg-on-primary/30" : "bg-white/20"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isEditing ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
          {isEditing && (
            <p className="text-[10px] text-inverse-on-surface/40 mt-2 px-1">
              sayfalardaki metin ve görselleri tıklayarak düzenleyebilirsiniz
            </p>
          )}
        </div>

        {/* Admin Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-inverse-on-surface/40 px-2 mb-2">
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
            <NavItem
              href="/admin/members"
              icon="group"
              label="kulüp üyeleri"
              current={pathname}
              onClick={() => setOpen(false)}
              badge={subscriberCount > 0 ? subscriberCount : undefined}
            />
            <NavItem
              href="/admin/email"
              icon="campaign"
              label="e-posta"
              current={pathname}
              onClick={() => setOpen(false)}
            />
            <button
              onClick={() => {
                setOpen(false);
                setShowCollections(true);
              }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm lowercase tracking-tight text-inverse-on-surface/80 hover:bg-white/10 hover:text-white transition-colors w-full"
            >
              <span className="material-symbols-outlined text-lg">collections_bookmark</span>
              <span className="flex-1 text-left">koleksiyonlar</span>
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setShowHeroPicker(true);
              }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm lowercase tracking-tight text-inverse-on-surface/80 hover:bg-white/10 hover:text-white transition-colors w-full"
            >
              <span className="material-symbols-outlined text-lg">home</span>
              <span className="flex-1 text-left">ana sayfa görselleri</span>
            </button>
          </div>

          {/* Stats */}
          <div className="px-6 mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-inverse-on-surface/40 mb-3">
              istatistikler
            </p>
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
        <div className="px-6 py-4 border-t border-white/10">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-error/80 text-inverse-on-surface text-sm font-bold lowercase tracking-tight transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            çıkış yap
          </button>
        </div>
      </div>
      {showCollections && (
        <CollectionManagerModal onClose={() => setShowCollections(false)} />
      )}
      {showHeroPicker && (
        <HeroPickerModal
          onClose={() => setShowHeroPicker(false)}
          onSaved={() => {
            setShowHeroPicker(false);
            router.refresh();
          }}
        />
      )}
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
