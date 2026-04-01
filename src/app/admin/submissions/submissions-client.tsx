"use client";

import { useState } from "react";

type Submission = {
  id: string;
  formType: "contact" | "custom_request" | "question";
  data: string;
  isRead: boolean;
  createdAt: string;
};

type Tab = "all" | "contact" | "custom_request" | "question";

const TAB_LABELS: Record<Tab, string> = {
  all: "tümü",
  contact: "iletişim",
  custom_request: "özel istek",
  question: "soru",
};

const TYPE_LABELS: Record<string, string> = {
  contact: "iletişim",
  custom_request: "özel istek",
  question: "soru",
};

const TYPE_COLORS: Record<string, string> = {
  contact: "bg-primary text-on-primary",
  custom_request: "bg-secondary-container text-on-secondary-container",
  question: "bg-tertiary text-on-tertiary",
};

function parseSender(formType: string, data: string): string {
  try {
    const parsed = JSON.parse(data);
    if (formType === "contact") return `${parsed.name || ""} <${parsed.email || ""}>`;
    if (formType === "custom_request") return `${parsed.firstName || ""} ${parsed.lastName || ""} <${parsed.email || ""}>`;
    if (formType === "question") return parsed.email || "";
    return "";
  } catch {
    return "";
  }
}

function parsePreview(formType: string, data: string): string {
  try {
    const parsed = JSON.parse(data);
    if (formType === "contact") return parsed.message || "";
    if (formType === "custom_request") return parsed.description || "";
    if (formType === "question") return parsed.question || "";
    return "";
  } catch {
    return "";
  }
}

type SubmissionsClientProps = {
  initialSubmissions: Submission[];
};

export function SubmissionsClient({ initialSubmissions }: SubmissionsClientProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    activeTab === "all"
      ? submissions
      : submissions.filter((s) => s.formType === activeTab);

  async function toggleRead(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/submissions/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !current }),
      });
      if (!res.ok) return;
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isRead: !current } : s))
      );
    } catch {
      // silent
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tab filters */}
      <div className="flex gap-2 border-b border-surface-container">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => {
          const count =
            tab === "all"
              ? submissions.length
              : submissions.filter((s) => s.formType === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-bold lowercase tracking-tight border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {TAB_LABELS[tab]}
              <span className="ml-2 text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-on-surface-variant lowercase">
          bu kategoride henüz form yok.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((sub) => {
            const expanded = expandedId === sub.id;
            let parsedData: Record<string, string> = {};
            try {
              parsedData = JSON.parse(sub.data);
            } catch {
              // ignore
            }

            return (
              <div
                key={sub.id}
                className={`border transition-colors ${
                  sub.isRead
                    ? "border-surface-container bg-white"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                {/* Summary row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container-low transition-colors"
                  onClick={() => setExpandedId(expanded ? null : sub.id)}
                >
                  {/* Unread dot */}
                  <div
                    className={`w-2 h-2 shrink-0 ${
                      sub.isRead ? "bg-transparent" : "bg-primary"
                    }`}
                  />

                  {/* Type badge */}
                  <span
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 ${
                      TYPE_COLORS[sub.formType] || "bg-surface-container text-on-surface"
                    }`}
                  >
                    {TYPE_LABELS[sub.formType] || sub.formType}
                  </span>

                  {/* Sender */}
                  <span className="text-sm font-semibold text-on-surface truncate max-w-[200px]">
                    {parseSender(sub.formType, sub.data)}
                  </span>

                  {/* Preview */}
                  <span className="text-sm text-on-surface-variant truncate flex-1 hidden md:block">
                    {parsePreview(sub.formType, sub.data)}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-on-surface-variant shrink-0">
                    {new Date(sub.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  {/* Expand icon */}
                  <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0">
                    {expanded ? "expand_less" : "expand_more"}
                  </span>
                </div>

                {/* Expanded content */}
                {expanded && (
                  <div className="p-6 border-t border-surface-container bg-white space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {Object.entries(parsedData).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                            {key}
                          </span>
                          <p className="text-on-surface whitespace-pre-wrap">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRead(sub.id, sub.isRead);
                        }}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-dim transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {sub.isRead ? "mark_email_unread" : "mark_email_read"}
                        </span>
                        {sub.isRead ? "okunmadı olarak işaretle" : "okundu olarak işaretle"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
