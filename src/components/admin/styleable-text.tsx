"use client";

import { useState, useRef, useEffect } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { TextStyleToolbar } from "./text-style-toolbar";
import { showToast } from "./toast";

type FieldStyle = { fontFamily: string | null; fontSize: number | null; color: string | null };

type StyleableTextProps = {
  entityType: "artwork" | "collection";
  entityId: string;
  fieldName: string;
  initialStyle?: FieldStyle | null;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  children: React.ReactNode;
};

export function StyleableText({
  entityType,
  entityId,
  fieldName,
  initialStyle,
  as: Tag = "span",
  className = "",
  children,
}: StyleableTextProps) {
  const { isEditing } = useAdmin();
  const [showToolbar, setShowToolbar] = useState(false);
  const [style, setStyle] = useState<FieldStyle>(
    initialStyle ?? { fontFamily: null, fontSize: null, color: null }
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showToolbar) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
        saveStyle(style);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showToolbar, style]);

  const inlineStyle: React.CSSProperties = {};
  if (style.fontFamily) inlineStyle.fontFamily = style.fontFamily;
  if (style.fontSize) inlineStyle.fontSize = `${style.fontSize}px`;
  if (style.color) inlineStyle.color = style.color;

  if (!isEditing) {
    return <Tag className={className} style={inlineStyle}>{children}</Tag>;
  }

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {showToolbar && (
        <TextStyleToolbar
          fontFamily={style.fontFamily}
          fontSize={style.fontSize}
          color={style.color}
          onChange={(s) => setStyle(s)}
          onReset={() => {
            setStyle({ fontFamily: null, fontSize: null, color: null });
            resetStyle();
            setShowToolbar(false);
          }}
        />
      )}
      <Tag
        className={`${className} group/style relative`}
        style={inlineStyle}
      >
        {children}
        <span
          className="material-symbols-outlined absolute -top-2 -left-2 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-70 hover:!opacity-100 transition-opacity cursor-pointer z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (showToolbar) saveStyle(style);
            setShowToolbar(!showToolbar);
          }}
        >
          format_size
        </span>
      </Tag>
    </div>
  );

  async function saveStyle(s: FieldStyle) {
    if (!s.fontFamily && !s.fontSize && !s.color) return;
    try {
      await fetch("/api/field-styles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          fieldName,
          fontFamily: s.fontFamily ?? "",
          fontSize: s.fontSize ?? 16,
          color: s.color ?? null,
        }),
      });
    } catch {}
  }

  async function resetStyle() {
    try {
      await fetch("/api/field-styles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, fieldName }),
      });
      showToast("stil sıfırlandı", "success");
    } catch {}
  }
}
