"use client";

import { useAdmin } from "@/hooks/use-admin";
import { useState, useRef, useEffect } from "react";
import { showToast } from "./toast";

type InlineEditProps = {
  pageSlug: string;
  sectionKey: string;
  initialContent: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "blockquote" | "div";
  className?: string;
  multiline?: boolean;
};

export function InlineEdit({
  pageSlug,
  sectionKey,
  initialContent,
  as: Tag = "span",
  className = "",
  multiline = false,
}: InlineEditProps) {
  const { isEditing: editMode } = useAdmin();
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (!editMode) return <Tag className={className}>{content}</Tag>;

  if (editing) {
    const InputTag = multiline ? "textarea" : "input";
    return (
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
          }
        }}
        className={`${className} outline-2 outline-primary/50 outline-dashed bg-transparent w-full resize-none`}
        rows={multiline ? 4 : undefined}
      />
    );
  }

  return (
    <Tag
      className={`${className} cursor-pointer outline outline-1 outline-primary/30 hover:outline-2 hover:outline-primary/50 group relative`}
      onClick={() => setEditing(true)}
    >
      {content}
      <span className="material-symbols-outlined absolute -top-2.5 -right-2.5 text-primary text-xs bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-primary/20 opacity-70 group-hover:opacity-100 transition-opacity">
        edit
      </span>
    </Tag>
  );

  async function handleSave() {
    if (content === initialContent) {
      setEditing(false);
      return;
    }
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
    } finally {
      setEditing(false);
    }
  }
}
