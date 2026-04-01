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
      className={`${className} cursor-pointer hover:outline-2 hover:outline-primary/30 hover:outline-dashed group relative`}
      onClick={() => setEditing(true)}
    >
      {content}
      <span className="material-symbols-outlined absolute -top-3 -right-3 text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 shadow-sm">
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
