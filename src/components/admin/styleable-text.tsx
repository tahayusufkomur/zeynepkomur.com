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

const DEFAULT_STYLE: FieldStyle = { fontFamily: null, fontSize: null, color: null };

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
  const [style, setStyle] = useState<FieldStyle>(initialStyle ?? DEFAULT_STYLE);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch saved style on mount if not provided via props
  useEffect(() => {
    if (initialStyle) return;
    fetch(`/api/field-styles?entityType=${entityType}&entityId=${entityId}&fieldName=${fieldName}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && (data.fontFamily || data.fontSize || data.color)) {
          setStyle({
            fontFamily: data.fontFamily || null,
            fontSize: data.fontSize || null,
            color: data.color || null,
          });
        }
      })
      .catch(() => {});
  }, [entityType, entityId, fieldName, initialStyle]);

  function saveStyleDebounced(s: FieldStyle) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch("/api/field-styles", {
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
      }).catch(() => {});
    }, 400);
  }

  function handleStyleChange(s: FieldStyle) {
    setStyle(s);
    saveStyleDebounced(s);
  }

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
          onChange={handleStyleChange}
          onReset={handleReset}
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
            setShowToolbar(!showToolbar);
          }}
        >
          format_size
        </span>
      </Tag>
    </div>
  );

  async function handleReset() {
    setStyle(DEFAULT_STYLE);
    setShowToolbar(false);
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
