import DOMPurify from "isomorphic-dompurify";

type RichTextProps = {
  html: string;
  className?: string;
  as?: "div" | "p" | "span";
};

const SAFE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "b", "i",
    "ul", "ol", "li",
    "h1", "h2", "h3", "h4", "blockquote",
    "a", "span",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

export function RichText({ html, className = "", as = "div" }: RichTextProps) {
  const clean = DOMPurify.sanitize(html ?? "", SAFE_CONFIG);
  const Tag = as;
  return (
    <Tag
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
