"use client";

import { useState, useEffect, useRef } from "react";

type FontEntry = { family: string; category: string };

type TextStyleToolbarProps = {
  fontFamily: string | null;
  fontSize: number | null;
  color: string | null;
  onChange: (style: { fontFamily: string | null; fontSize: number | null; color: string | null }) => void;
  onReset: () => void;
};

export function TextStyleToolbar({ fontFamily, fontSize, color, onChange, onReset }: TextStyleToolbarProps) {
  const [fonts, setFonts] = useState<FontEntry[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState<"above" | "below">("above");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolbarRef.current) return;
    const rect = toolbarRef.current.getBoundingClientRect();
    if (rect.top < 0) setPosition("below");
  }, []);

  useEffect(() => {
    fetch("/api/fonts")
      .then((r) => r.json())
      .then(setFonts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function loadFont(family: string) {
    if (loadedFonts.has(family)) return;
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&subset=latin,latin-ext&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setLoadedFonts((prev) => new Set(prev).add(family));
  }

  function selectFont(family: string) {
    loadFont(family);
    onChange({ fontFamily: family, fontSize, color });
    setShowDropdown(false);
    setSearch("");
  }

  const filtered = search
    ? fonts.filter((f) => f.family.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : fonts.slice(0, 50);

  return (
    <div
      ref={toolbarRef}
      style={{ fontSize: "14px", lineHeight: "1.4", letterSpacing: "normal", fontWeight: "normal", textTransform: "none" as const }}
      className={`absolute left-0 z-50 flex items-center gap-3 bg-white shadow-xl border border-surface-container px-4 py-3 rounded-md ${
        position === "above" ? "bottom-full mb-2" : "top-full mt-2"
      }`}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
      }}
    >
      {/* Font picker */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 text-sm border border-outline-variant px-3 py-1.5 hover:border-primary transition-colors min-w-[160px] text-left truncate"
        >
          {fontFamily || "varsayılan"}
          <span className="material-symbols-outlined text-sm ml-auto">expand_more</span>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-surface-container w-72 max-h-72 flex flex-col z-50">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="font ara..."
              className="w-full px-3 py-2.5 text-sm border-b border-surface-container outline-none"
              autoFocus
            />
            <div className="overflow-y-auto flex-1">
              <button
                onClick={() => {
                  onChange({ fontFamily: null, fontSize, color });
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-surface-container-low text-on-surface-variant"
              >
                varsayılan
              </button>
              {filtered.map((font) => {
                loadFont(font.family);
                return (
                  <button
                    key={font.family}
                    onClick={() => selectFont(font.family)}
                    className={`w-full px-3 py-2 text-left hover:bg-surface-container-low flex items-center justify-between gap-2 ${
                      fontFamily === font.family ? "bg-primary/10 text-primary font-bold" : ""
                    }`}
                  >
                    <span className="text-sm truncate">{font.family}</span>
                    <span className="text-base text-on-surface-variant shrink-0" style={{ fontFamily: font.family }}>Aa</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Size slider */}
      <div className="flex items-center gap-1">
        <input
          type="range"
          min={12}
          max={120}
          value={fontSize ?? 16}
          onChange={(e) => onChange({ fontFamily, fontSize: parseInt(e.target.value), color })}
          className="w-24 h-1.5 accent-primary"
        />
        <span className="text-xs font-bold text-on-surface-variant w-8 text-center">
          {fontSize ?? "—"}
        </span>
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-1">
        <input
          type="color"
          value={color || "#000000"}
          onChange={(e) => onChange({ fontFamily, fontSize, color: e.target.value })}
          className="w-7 h-7 border border-outline-variant rounded cursor-pointer p-0"
        />
        {color && (
          <button
            onClick={() => onChange({ fontFamily, fontSize, color: null })}
            className="text-xs text-on-surface-variant hover:text-error"
            title="Rengi sıfırla"
          >
            <span className="material-symbols-outlined text-sm">format_color_reset</span>
          </button>
        )}
      </div>

      {/* Reset all */}
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-error transition-colors border border-outline-variant px-2 py-1 rounded hover:border-error"
        title="Tüm stili sıfırla"
      >
        <span className="material-symbols-outlined text-sm">restart_alt</span>
        sıfırla
      </button>
    </div>
  );
}
