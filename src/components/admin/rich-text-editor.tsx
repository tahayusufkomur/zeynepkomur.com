"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ value, onChange, placeholder, className = "" }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none min-h-[140px] px-4 py-3 focus:outline-none text-on-surface",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content synced if parent replaces `value` externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="min-h-[140px] border border-outline-variant bg-surface-container-low" />;
  }

  const btn = (active: boolean) =>
    `px-2 py-1 text-xs font-bold lowercase border transition-colors ${
      active
        ? "bg-primary text-on-primary border-primary"
        : "bg-white text-on-surface border-outline-variant hover:bg-surface-container-low"
    }`;

  return (
    <div className={`border border-outline-variant bg-white ${className}`}>
      <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-outline-variant bg-surface-container-low">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Kalın">
          <span className="material-symbols-outlined text-base align-middle">format_bold</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="İtalik">
          <span className="material-symbols-outlined text-base align-middle">format_italic</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))} title="Üstü çizili">
          <span className="material-symbols-outlined text-base align-middle">format_strikethrough</span>
        </button>
        <span className="w-px bg-outline-variant mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Başlık">
          H2
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="Alt başlık">
          H3
        </button>
        <span className="w-px bg-outline-variant mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Madde listesi">
          <span className="material-symbols-outlined text-base align-middle">format_list_bulleted</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Numaralı liste">
          <span className="material-symbols-outlined text-base align-middle">format_list_numbered</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Alıntı">
          <span className="material-symbols-outlined text-base align-middle">format_quote</span>
        </button>
        <span className="w-px bg-outline-variant mx-1" />
        <button type="button" onClick={setLink} className={btn(editor.isActive("link"))} title="Bağlantı">
          <span className="material-symbols-outlined text-base align-middle">link</span>
        </button>
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={btn(false)} title="Biçimi temizle">
          <span className="material-symbols-outlined text-base align-middle">format_clear</span>
        </button>
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
