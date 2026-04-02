"use client";

import { InlineEdit } from "@/components/admin/inline-edit";

type CategoryBarProps = {
  activeCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
  labels?: Record<string, string>;
};

const categories = [
  {
    key: "resim",
    defaultLabel: "resim",
    bgColor: "#004494",
    textColor: "text-white",
    hoverOverlay: "bg-primary",
  },
  {
    key: "dekorasyon",
    defaultLabel: "dekorasyon",
    bgColor: "#FFD700",
    textColor: "text-[#4e4600]",
    hoverOverlay: "bg-white",
  },
  {
    key: "posterler",
    defaultLabel: "posterler",
    bgColor: "#9d0058",
    textColor: "text-white",
    hoverOverlay: "bg-tertiary-container",
  },
];

export function CategoryBar({ activeCategory, onCategoryChange, labels }: CategoryBarProps) {
  return (
    <section className="mt-12 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() =>
              onCategoryChange?.(activeCategory === cat.key ? null : cat.key)
            }
            className={`group relative overflow-hidden h-56 flex items-center justify-center ${
              activeCategory && activeCategory !== cat.key ? "opacity-50" : ""
            } transition-opacity duration-300`}
            style={{ backgroundColor: cat.bgColor }}
          >
            <span
              className={`relative z-10 ${cat.textColor} text-3xl font-extrabold tracking-tighter`}
            >
              <InlineEdit
                pageSlug="galeri"
                sectionKey={`category_${cat.key}_label`}
                initialContent={labels?.[cat.key] ?? cat.defaultLabel}
                as="span"
                className={`${cat.textColor} text-3xl font-extrabold tracking-tighter`}
              />
            </span>
            <div
              className={`absolute inset-0 ${cat.hoverOverlay} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
