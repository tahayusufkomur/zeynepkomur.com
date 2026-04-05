"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useState, useRef, useEffect } from "react";
import { showToast } from "./toast";
import { TextStyleToolbar } from "./text-style-toolbar";

type FieldStyle = { fontFamily: string | null; fontSize: number | null; color: string | null };

type InlineEditProps = {
  pageSlug: string;
  sectionKey: string;
  initialContent: string;
  initialStyle?: FieldStyle;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "blockquote" | "div";
  className?: string;
  multiline?: boolean;
};

export function InlineEdit({
  pageSlug,
  sectionKey,
  initialContent,
  initialStyle,
  as: Tag = "span",
  className = "",
  multiline = false,
}: InlineEditProps) {
  const { isEditing: editMode } = useAdmin();
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [style, setStyle] = useState<FieldStyle>(initialStyle ?? { fontFamily: null, fontSize: null, color: null });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

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

  if (!editMode) return <Tag className={className} style={inlineStyle}>{content}</Tag>;

  if (editing) {
    const InputTag = multiline ? "textarea" : "input";
    return (
      <div ref={wrapperRef} className="relative">
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
        <InputTag
          ref={inputRef as any}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (!multiline && e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setContent(initialContent);
              setEditing(false);
              setShowToolbar(false);
            }
          }}
          className={`${className} outline-2 outline-primary/50 outline-dashed bg-transparent w-full resize-none`}
          style={inlineStyle}
          rows={multiline ? 4 : undefined}
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
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
        className={`${className} cursor-pointer outline outline-1 outline-primary/30 hover:outline-2 hover:outline-primary/50 group relative`}
        style={inlineStyle}
        onClick={() => setEditing(true)}
      >
        {content}
        <span className="material-symbols-outlined absolute -top-2.5 -right-2.5 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-70 transition-opacity">
          edit
        </span>
        <span
          className="material-symbols-outlined absolute -top-2.5 -left-2.5 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-70 transition-opacity"
          onClick={(e) => {
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

  async function handleSave() {
    setShowToolbar(false);
    if (content !== initialContent) {
      try {
        const res = await fetch("/api/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageSlug, sectionKey, content }),
        });
        if (!res.ok) throw new Error();
        showToast("kaydedildi", "success");
      } catch {
        setContent(initialContent);
        showToast("kaydedilemedi, tekrar deneyin", "error");
      }
    }
    setEditing(false);
    saveStyle(style);
  }

  async function saveStyle(s: FieldStyle) {
    if (!s.fontFamily && !s.fontSize && !s.color) return;
    try {
      await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          sectionKey: `${sectionKey}_style`,
          content: JSON.stringify({ fontFamily: s.fontFamily, fontSize: s.fontSize, color: s.color }),
        }),
      });
    } catch {}
  }

  async function resetStyle() {
    try {
      await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          sectionKey: `${sectionKey}_style`,
          content: "{}",
        }),
      });
      showToast("stil sıfırlandı", "success");
    } catch {}
  }
}
