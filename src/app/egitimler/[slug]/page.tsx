export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { trainings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getFooterContent } from "@/lib/get-footer-content";
import { getNavbarContent } from "@/lib/get-navbar-content";
import { TrainingDetailClient } from "./training-detail-client";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [training] = await db.select().from(trainings).where(eq(trainings.slug, slug));
  if (!training) return { title: "Eğitim Bulunamadı" };
  return {
    title: `${training.title} — Zeynep Kömür`,
    openGraph: training.imagePath ? { images: [training.imagePath] } : undefined,
  };
}

export default async function TrainingDetailPage({ params }: Props) {
  const { slug } = await params;
  const [training] = await db.select().from(trainings).where(eq(trainings.slug, slug));
  if (!training) notFound();

  const footerContent = await getFooterContent();
  const navItems = await getNavbarContent();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentPage="egitimler" navItems={navItems} />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-8 pb-24">
        <nav className="py-6 text-sm text-on-surface-variant lowercase tracking-wider">
          <Link href="/egitimler" className="hover:text-primary transition-colors">
            eğitimler
          </Link>
          <span className="mx-2">/</span>
          <span className="text-on-surface">{training.title}</span>
        </nav>

        <TrainingDetailClient training={training} />
      </main>
      <Footer variant="white" content={footerContent} />
    </div>
  );
}
