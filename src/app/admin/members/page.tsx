import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { newsletterSubscribers } from "@/lib/db/schema";
import { desc, count } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const members = await db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.subscribedAt));

  const [{ total }] = await db.select({ total: count() }).from(newsletterSubscribers);

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <div className="bg-white border-b border-surface-container px-8 py-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-on-surface lowercase tracking-tighter">
              kulüp üyeleri
            </h1>
            <p className="text-xs text-primary font-semibold">
              {total} üye
            </p>
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
      <div className="max-w-3xl mx-auto px-8 py-12">
        {members.length === 0 ? (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-outline/30 text-7xl">group</span>
            <p className="text-on-surface-variant mt-4 lowercase">henüz üye bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-surface-container">
              <div className="col-span-5">e-posta</div>
              <div className="col-span-4">isim</div>
              <div className="col-span-3">katılım tarihi</div>
            </div>

            {/* Rows */}
            {members.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-surface-container-highest/30"
              >
                <div className="col-span-5 text-sm text-on-surface font-medium truncate">
                  {member.email}
                </div>
                <div className="col-span-4 text-sm text-on-surface-variant lowercase truncate">
                  {member.name || "—"}
                </div>
                <div className="col-span-3 text-xs text-on-surface-variant">
                  {new Date(member.subscribedAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
