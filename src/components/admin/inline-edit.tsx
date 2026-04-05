"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useState, useRef, useEffect, useCallback } from "react";
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

// Module-level caches so data survives component remounts
const styleCache = new Map<string, FieldStyle>();
const contentCache = new Map<string, string>();

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
  const cacheKey = `${pageSlug}:${sectionKey}`;
  const [content, setContent] = useState(contentCache.get(cacheKey) ?? initialContent);
  const [editing, setEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [style, setStyle] = useState<FieldStyle>(
    initialStyle ?? styleCache.get(cacheKey) ?? DEFAULT_STYLE
  );
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  // Auto-save text content when edit mode is toggled off while editing
  const saveContent = useCallback(async (text: string) => {
    if (text === initialContent) return;
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageSlug, sectionKey, content: text }),
      });
      if (!res.ok) throw new Error();
      showToast("kaydedildi", "success");
    } catch {
      showToast("kaydedilemedi, tekrar deneyin", "error");
    }
  }, [pageSlug, sectionKey, initialContent]);

  useEffect(() => {
    if (!editMode && editing) {
      // Edit mode was toggled off while we were editing — save and exit
      saveContent(contentRef.current);
      setEditing(false);
      setShowToolbar(false);
    }
  }, [editMode, editing, saveContent]);

  // Fetch saved style on mount if not provided via props and not in cache
  useEffect(() => {
    if (initialStyle || styleCache.has(cacheKey)) return;
    fetch(`/api/content?page=${pageSlug}&section=${sectionKey}_style`)
      .then((r) => r.json())
      .then((rows: { content: string }[]) => {
        if (rows.length > 0) {
          try {
            const parsed = JSON.parse(rows[0].content);
            if (parsed.fontFamily || parsed.fontSize || parsed.color) {
              const s: FieldStyle = {
                fontFamily: parsed.fontFamily || null,
                fontSize: parsed.fontSize || null,
                color: parsed.color || null,
              };
              styleCache.set(cacheKey, s);
              setStyle(s);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [pageSlug, sectionKey, initialStyle, cacheKey]);

  function saveStyleDebounced(s: FieldStyle) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/content", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageSlug,
            sectionKey: `${sectionKey}_style`,
            content: JSON.stringify({ fontFamily: s.fontFamily, fontSize: s.fontSize, color: s.color }),
          }),
        });
        if (!res.ok) {
          console.error("[InlineEdit] save failed:", res.status, await res.text());
        }
      } catch (err) {
        console.error("[InlineEdit] save error:", err);
      }
    }, 400);
  }

  function handleStyleChange(s: FieldStyle) {
    setStyle(s);
    styleCache.set(cacheKey, s);
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
          onChange={(e) => {
            setContent(e.target.value);
            contentCache.set(cacheKey, e.target.value);
          }}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (!multiline && e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setContent(initialContent);
              contentCache.delete(cacheKey);
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
    await saveContent(content);
    setEditing(false);
  }

  async function handleReset() {
    setStyle(DEFAULT_STYLE);
    styleCache.delete(cacheKey);
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
