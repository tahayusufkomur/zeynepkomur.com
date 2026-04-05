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

const DEFAULT_STYLE: FieldStyle = { fontFamily: null, fontSize: null, color: null };

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
  const [style, setStyle] = useState<FieldStyle>(initialStyle ?? DEFAULT_STYLE);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  // Fetch saved style on mount if not provided via props
  useEffect(() => {
    if (initialStyle) return;
    fetch(`/api/content?page=${pageSlug}&section=${sectionKey}_style`)
      .then((r) => r.json())
      .then((rows: { content: string }[]) => {
        if (rows.length > 0) {
          try {
            const parsed = JSON.parse(rows[0].content);
            if (parsed.fontFamily || parsed.fontSize || parsed.color) {
              setStyle({
                fontFamily: parsed.fontFamily || null,
                fontSize: parsed.fontSize || null,
                color: parsed.color || null,
              });
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [pageSlug, sectionKey, initialStyle]);

  function saveStyleDebounced(s: FieldStyle) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          sectionKey: `${sectionKey}_style`,
          content: JSON.stringify({ fontFamily: s.fontFamily, fontSize: s.fontSize, color: s.color }),
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
            onChange={handleStyleChange}
            onReset={handleReset}
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
          onChange={handleStyleChange}
          onReset={handleReset}
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
          className="material-symbols-outlined absolute -top-2.5 -left-2.5 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-70 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
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
  }

  async function handleReset() {
    setStyle(DEFAULT_STYLE);
    setShowToolbar(false);
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
