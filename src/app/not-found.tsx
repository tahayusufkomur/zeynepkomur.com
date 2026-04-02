export const dynamic = "force-dynamic";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getNavbarContent } from "@/lib/get-navbar-content";

export default async function NotFound() {
  const navItems = await getNavbarContent();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="" navItems={navItems} />

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        {/* 404 number */}
        <p className="text-8xl md:text-[12rem] font-extrabold tracking-tighter text-primary leading-none mb-4">
          404
        </p>

        {/* Message */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface lowercase mb-6">
          sayfa bulunamadı
        </h1>

        <p className="text-on-surface-variant text-lg lowercase max-w-md mb-12">
          aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
        </p>

        {/* Decorative line */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-[2px] bg-primary" />
          <span className="material-symbols-outlined text-secondary-container text-3xl">
            palette
          </span>
          <div className="w-16 h-[2px] bg-primary" />
        </div>

        {/* Back home link */}
        <Link
          href="/"
          className="inline-flex items-center gap-3 bg-primary text-on-primary px-8 py-4 font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors duration-300"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          anasayfaya dön
        </Link>
      </main>

      <Footer variant="white" />
    </div>
  );
}
