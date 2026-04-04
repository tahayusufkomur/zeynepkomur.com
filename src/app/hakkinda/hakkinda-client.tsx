"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { InlineEdit } from "@/components/admin/inline-edit";

export function HakkindaPortrait({ initialSrc }: { initialSrc: string }) {
  const [src, setSrc] = useState(initialSrc);

  async function handleUpload(newPath: string) {
    setSrc(newPath);
    await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageSlug: "hakkinda", sectionKey: "portrait_image", content: newPath }),
    });
  }

  return (
    <ImageUpload currentSrc={src} category="pages" onUpload={handleUpload}>
      <img
        src={src}
        alt="Zeynep Kömür"
        className="w-full aspect-[4/5] object-cover grayscale"
      />
    </ImageUpload>
  );
}

type FieldStyle = { fontFamily: string | null; fontSize: number | null };

export function HakkindaSkills({
  skill1,
  skill2,
  skill3,
  styleMap,
}: {
  skill1: string;
  skill2: string;
  skill3: string;
  styleMap?: Record<string, FieldStyle>;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-6">
      <div className="flex items-center gap-2 bg-secondary-container px-4 py-2 text-on-secondary-container text-xs font-bold tracking-widest lowercase">
        <span className="material-symbols-outlined text-sm">palette</span>
        <InlineEdit pageSlug="hakkinda" sectionKey="skill_1" initialContent={skill1} initialStyle={styleMap?.["skill_1"]} as="span" className="text-xs font-bold tracking-widest lowercase" />
      </div>
      <div className="flex items-center gap-2 bg-tertiary-container px-4 py-2 text-on-tertiary-container text-xs font-bold tracking-widest lowercase">
        <span className="material-symbols-outlined text-sm">architecture</span>
        <InlineEdit pageSlug="hakkinda" sectionKey="skill_2" initialContent={skill2} initialStyle={styleMap?.["skill_2"]} as="span" className="text-xs font-bold tracking-widest lowercase" />
      </div>
      <div className="flex items-center gap-2 bg-primary-container px-4 py-2 text-on-primary-container text-xs font-bold tracking-widest lowercase">
        <span className="material-symbols-outlined text-sm">frame_person</span>
        <InlineEdit pageSlug="hakkinda" sectionKey="skill_3" initialContent={skill3} initialStyle={styleMap?.["skill_3"]} as="span" className="text-xs font-bold tracking-widest lowercase" />
      </div>
    </div>
  );
}

export function HakkindaIdentityLabel({ initialContent, initialStyle }: { initialContent: string; initialStyle?: FieldStyle }) {
  return (
    <InlineEdit
      pageSlug="hakkinda"
      sectionKey="identity_label"
      initialContent={initialContent}
      initialStyle={initialStyle}
      as="span"
      className="font-bold text-sm tracking-widest lowercase"
    />
  );
}
