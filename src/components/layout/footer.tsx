"use client";

import Link from "next/link";
import { InlineEdit } from "@/components/admin/inline-edit";

type FooterProps = {
  variant: "white" | "yellow";
  content?: Record<string, string>;
};

const DEFAULTS: Record<string, string> = {
  tagline: "sanatın herkes için erişilebilir olduğu, sınırların kalktığı dijital bir kürasyon alanı.",
  brand: "by zeynep kömür",
  copyright: "by zeynep kömür. all rights reserved.",
  copyright_yellow: "by zeynep kömür. sade ama vurucu.",
  email: "info@zeyn.art",
  phone: "+900000000000",
  phone_label: "telefon",
  email_label: "e-posta",
  instagram_label: "instagram",
  instagram_url: "https://instagram.com",
};

function c(content: Record<string, string> | undefined, key: string) {
  return content?.[key] ?? DEFAULTS[key];
}

export function Footer({ variant, content }: FooterProps) {
  if (variant === "yellow") return <YellowFooter content={content} />;
  return <WhiteFooter content={content} />;
}

function WhiteFooter({ content }: { content?: Record<string, string> }) {
  return (
    <footer className="bg-white grid grid-cols-1 md:grid-cols-3 gap-12 px-12 py-24 w-full border-t border-outline/20">
      <div className="flex flex-col space-y-6">
        <InlineEdit
          pageSlug="footer"
          sectionKey="brand"
          initialContent={c(content, "brand")}
          as="div"
          className="text-xl font-bold text-on-surface lowercase"
        />
        <InlineEdit
          pageSlug="footer"
          sectionKey="tagline"
          initialContent={c(content, "tagline")}
          as="p"
          multiline
          className="text-on-surface-variant max-w-xs font-body text-sm leading-relaxed tracking-wide lowercase"
        />
      </div>
      <div className="flex flex-col space-y-4 md:items-center">
        <div className="flex flex-col space-y-3">
          <Link
            href={`tel:${c(content, "phone")}`}
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            <InlineEdit
              pageSlug="footer"
              sectionKey="phone_label"
              initialContent={c(content, "phone_label")}
              as="span"
              className="text-on-surface-variant font-body text-sm tracking-[0.1em] lowercase"
            />
          </Link>
          <Link
            href={`mailto:${c(content, "email")}`}
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            <InlineEdit
              pageSlug="footer"
              sectionKey="email_label"
              initialContent={c(content, "email_label")}
              as="span"
              className="text-on-surface-variant font-body text-sm tracking-[0.1em] lowercase"
            />
          </Link>
          <Link
            href={c(content, "instagram_url")}
            className="text-on-surface-variant hover:text-primary transition-all duration-300 font-body text-sm tracking-[0.1em] lowercase"
          >
            <InlineEdit
              pageSlug="footer"
              sectionKey="instagram_label"
              initialContent={c(content, "instagram_label")}
              as="span"
              className="text-on-surface-variant font-body text-sm tracking-[0.1em] lowercase"
            />
          </Link>
        </div>
      </div>
      <div className="flex flex-col space-y-6 md:items-end justify-between">
        <div className="flex space-x-8">
          <span className="material-symbols-outlined text-primary text-3xl">palette</span>
          <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>brush</span>
          <span className="material-symbols-outlined text-highlight-pink text-3xl">gallery_thumbnail</span>
        </div>
        <InlineEdit
          pageSlug="footer"
          sectionKey="copyright"
          initialContent={c(content, "copyright")}
          as="div"
          className="text-on-surface-variant font-body text-xs tracking-[0.2em] lowercase opacity-60"
        />
      </div>
    </footer>
  );
}

function YellowFooter({ content }: { content?: Record<string, string> }) {
  return (
    <footer className="bg-secondary-container flex flex-col md:flex-row justify-between items-center w-full px-12 py-16 font-body text-sm lowercase">
      <InlineEdit
        pageSlug="footer"
        sectionKey="copyright_yellow"
        initialContent={c(content, "copyright_yellow")}
        as="div"
        className="font-bold text-on-secondary-container mb-8 md:mb-0 text-base"
      />
      <div className="flex flex-wrap justify-center gap-12 text-on-secondary-container">
        <Link href={`tel:${c(content, "phone")}`} className="hover:text-primary transition-all flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-base">call</span>
          <InlineEdit pageSlug="footer" sectionKey="phone_label" initialContent={c(content, "phone_label")} as="span" className="font-medium" />
        </Link>
        <Link href={`mailto:${c(content, "email")}`} className="hover:text-primary transition-all flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-base">mail</span>
          <InlineEdit pageSlug="footer" sectionKey="email_label" initialContent={c(content, "email_label")} as="span" className="font-medium" />
        </Link>
        <Link href={c(content, "instagram_url")} className="underline font-bold hover:text-primary transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-base">camera</span>
          <InlineEdit pageSlug="footer" sectionKey="instagram_label" initialContent={c(content, "instagram_label")} as="span" className="font-bold" />
        </Link>
      </div>
    </footer>
  );
}
