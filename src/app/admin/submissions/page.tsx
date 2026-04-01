import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { formSubmissions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { SubmissionsClient } from "./submissions-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const submissions = await db
    .select()
    .from(formSubmissions)
    .orderBy(desc(formSubmissions.createdAt));

  const unreadCount = submissions.filter((s) => !s.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <div className="bg-white border-b border-surface-container px-8 py-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-on-surface lowercase tracking-tighter">
              form gönderimleri
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs text-primary font-semibold">
                {unreadCount} okunmamış mesaj
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-on-surface-variant lowercase">
            {session.user.email}
          </span>
          <Link
            href="/"
            className="text-on-surface-variant hover:text-primary text-xs underline lowercase"
          >
            siteye dön
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <SubmissionsClient initialSubmissions={submissions} />
      </div>
    </div>
  );
}
