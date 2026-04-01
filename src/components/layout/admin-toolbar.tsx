"use client";

import { useAdmin } from "@/hooks/use-admin";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminToolbar() {
  const { isAdmin } = useAdmin();
  const pathname = usePathname();
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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-inverse-surface text-inverse-on-surface px-6 py-2 flex items-center justify-between text-xs font-body">
      <div className="flex items-center gap-6">
        <span className="font-bold uppercase tracking-widest">admin</span>
        <span className="text-inverse-on-surface/60">{pathname}</span>
      </div>
      <div className="flex items-center gap-6">
        <Link
          href="/admin/submissions"
          className="hover:text-secondary-container transition-colors"
        >
          gönderiler{" "}
          {unreadCount > 0 && (
            <span className="bg-error text-on-error px-2 py-0.5 ml-1">
              {unreadCount}
            </span>
          )}
        </Link>
        <span className="text-inverse-on-surface/60">
          bülten: {subscriberCount}
        </span>
        <button
          onClick={() => signOut()}
          className="hover:text-error transition-colors"
        >
          çıkış
        </button>
      </div>
    </div>
  );
}
