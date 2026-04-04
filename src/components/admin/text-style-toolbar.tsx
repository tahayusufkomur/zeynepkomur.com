"use client";

import { useState, useEffect, useRef } from "react";

type FontEntry = { family: string; category: string };

type TextStyleToolbarProps = {
  fontFamily: string | null;
  fontSize: number | null;
  onChange: (style: { fontFamily: string | null; fontSize: number | null }) => void;
  onReset: () => void;
};

export function TextStyleToolbar({ fontFamily, fontSize, onChange, onReset }: TextStyleToolbarProps) {
  const [fonts, setFonts] = useState<FontEntry[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setLoadedFonts((prev) => new Set(prev).add(family));
  }

  function selectFont(family: string) {
    loadFont(family);
    onChange({ fontFamily: family, fontSize });
    setShowDropdown(false);
    setSearch("");
  }

  const filtered = search
    ? fonts.filter((f) => f.family.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
    : fonts.slice(0, 50);

  return (
    <div
      className="absolute -top-14 left-0 z-50 flex items-center gap-2 bg-white shadow-lg border border-surface-container px-3 py-2 rounded-sm"
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Font picker */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 text-xs border border-outline-variant px-2 py-1 hover:border-primary transition-colors min-w-[140px] text-left truncate"
          style={fontFamily ? { fontFamily } : undefined}
        >
          {fontFamily || "varsayılan"}
          <span className="material-symbols-outlined text-sm ml-auto">expand_more</span>
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white shadow-xl border border-surface-container w-64 max-h-64 flex flex-col z-50">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="font ara..."
              className="w-full px-3 py-2 text-xs border-b border-surface-container outline-none"
              autoFocus
            />
            <div className="overflow-y-auto flex-1">
              <button
                onClick={() => {
                  onChange({ fontFamily: null, fontSize });
                  setShowDropdown(false);
                }}
                className="w-full px-3 py-2 text-xs text-left hover:bg-surface-container-low text-on-surface-variant"
              >
                varsayılan
              </button>
              {filtered.map((font) => {
                loadFont(font.family);
                return (
                  <button
                    key={font.family}
                    onClick={() => selectFont(font.family)}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-surface-container-low truncate ${
                      fontFamily === font.family ? "bg-primary/10 text-primary font-bold" : ""
                    }`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.family}
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
          onChange={(e) => onChange({ fontFamily, fontSize: parseInt(e.target.value) })}
          className="w-20 h-1 accent-primary"
        />
        <span className="text-[10px] font-bold text-on-surface-variant w-8 text-center">
          {fontSize ?? "—"}
        </span>
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
        title="Stili sıfırla"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
