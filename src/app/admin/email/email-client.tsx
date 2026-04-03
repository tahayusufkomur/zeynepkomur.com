"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";

// --- Types ---

type Member = { id: string; email: string; name: string | null };

type Template = {
  id: string;
  name: string;
  category: string | null;
  json_data: unknown | null;
};

type Campaign = {
  id: string;
  templateName: string;
  subject: string;
  recipientCount: number;
  successCount: number;
  status: "sending" | "sent" | "partial" | "failed";
  sentAt: string | null;
  createdAt: string;
};

type WizardStep = 1 | 2 | 3 | 4;
type Tab = "new" | "history";

const STEP_LABELS = ["şablon", "düzenle", "alıcılar", "gönder"];
const MAILCRAFT_ORIGIN = "https://mailcraft.contentor.app";

// --- Main Component ---

export function EmailClient({
  members,
  userEmail,
}: {
  members: Member[];
  userEmail: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("new");

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header */}
      <div className="bg-white border-b border-surface-container px-8 py-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-on-surface lowercase tracking-tighter">
              e-posta
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-on-surface-variant lowercase">
            {userEmail}
          </span>
          <Link
            href="/"
            className="text-on-surface-variant hover:text-primary text-xs underline lowercase"
          >
            siteye dön
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-8 pt-8">
        <div className="flex gap-2 border-b border-surface-container">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-6 py-3 text-sm font-bold lowercase tracking-tight border-b-2 transition-colors ${
              activeTab === "new"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            yeni e-posta
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 text-sm font-bold lowercase tracking-tight border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            gönderim geçmişi
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {activeTab === "new" ? (
          <NewEmailWizard members={members} onSent={() => setActiveTab("history")} />
        ) : (
          <div className="max-w-5xl mx-auto">
            <SendHistory />
          </div>
        )}
      </div>
    </div>
  );
}

// --- Wizard ---

function NewEmailWizard({
  members,
  onSent,
}: {
  members: Member[];
  onSent: () => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [subject, setSubject] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState("");

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => {
          const stepNum = (i + 1) as WizardStep;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <span className={`w-8 h-px ${isCompleted ? "bg-primary" : "bg-surface-container"}`} />
              )}
              <button
                onClick={() => isCompleted && setStep(stepNum)}
                disabled={!isCompleted}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-primary/60 hover:text-primary cursor-pointer"
                    : "text-on-surface-variant/40"
                }`}
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {isCompleted ? "✓" : stepNum}
                </span>
                {label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Steps */}
      {step === 1 && (
        <TemplateStep
          onSelect={(t) => {
            setSelectedTemplate(t);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <EditorStep
          selectedTemplate={selectedTemplate}
          subject={subject}
          onSubjectChange={setSubject}
          onContinue={() => {
            setTemplateId(selectedTemplate?.id || "");
            setTemplateName(selectedTemplate?.name || "Untitled");
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <div className="max-w-5xl mx-auto">
        <RecipientsStep
          members={members}
          selectedMembers={selectedMembers}
          onSelectionChange={setSelectedMembers}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
        />
        </div>
      )}
      {step === 4 && (
        <div className="max-w-5xl mx-auto">
        <ReviewStep
          templateName={templateName}
          subject={subject}
          recipientCount={selectedMembers.length}
          sendStatus={sendStatus}
          sendError={sendError}
          onSend={async () => {
            setSendStatus("sending");
            setSendError("");
            try {
              const res = await fetch("/api/email/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  templateId,
                  templateName,
                  subject,
                  recipients: selectedMembers.map((m) => ({
                    email: m.email,
                    name: m.name,
                  })),
                }),
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gönderim başarısız");
              }
              setSendStatus("sent");
            } catch (e: any) {
              setSendStatus("error");
              setSendError(e.message || "Bir hata oluştu");
            }
          }}
          onBack={() => setStep(3)}
          onGoToHistory={onSent}
        />
        </div>
      )}
    </div>
  );
}

// --- Step 1: Templates ---

function TemplateStep({ onSelect }: { onSelect: (t: Template) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTemplates = useCallback(() => {
    setLoading(true);
    fetch("/api/email/templates")
      .then((r) => {
        if (!r.ok) throw new Error("Şablonlar yüklenemedi");
        return r.json();
      })
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  if (loading) {
    return (
      <div className="text-center py-24 text-on-surface-variant lowercase">
        şablonlar yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24 text-error lowercase">{error}</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Start blank */}
      <button
        onClick={() => onSelect({ id: "", name: "Boş Şablon", category: null, json_data: null })}
        className="w-full border-2 border-dashed border-surface-container hover:border-primary py-12 text-on-surface-variant hover:text-primary transition-colors lowercase font-bold tracking-tight"
      >
        <span className="material-symbols-outlined text-3xl block mb-2">add</span>
        boş başla
      </button>

      {/* Saved templates */}
      {templates.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            kayıtlı şablonlar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onSelect={onSelect} onDeleted={fetchTemplates} />
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant lowercase">
          henüz şablon bulunmuyor. boş başlayabilirsiniz.
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
  onDeleted,
}: {
  template: Template;
  onSelect: (t: Template) => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/email/templates/${template.id}`, { method: "DELETE" });
      if (res.ok) onDeleted();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="border border-surface-container hover:border-primary bg-white text-left transition-colors group overflow-hidden relative">
      <button onClick={() => onSelect(template)} className="w-full text-left">
        {/* Thumbnail preview */}
        <div className="w-full h-48 bg-surface-container-low overflow-hidden">
          <iframe
            src={`/api/email/templates/${template.id}/preview`}
            className="w-[600px] h-[800px] origin-top-left pointer-events-none"
            style={{ transform: "scale(0.28)" }}
            tabIndex={-1}
            aria-hidden
          />
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold text-on-surface lowercase truncate">
            {template.name}
          </p>
          {template.category && (
            <p className="text-xs text-on-surface-variant mt-1 lowercase">
              {template.category}
            </p>
          )}
        </div>
      </button>
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-error hover:text-on-error text-on-surface-variant transition-colors opacity-0 group-hover:opacity-100"
      >
        <span className="material-symbols-outlined text-base">
          {deleting ? "hourglass_empty" : "delete"}
        </span>
      </button>
    </div>
  );
}

// --- Step 2: Editor ---

function EditorStep({
  selectedTemplate,
  subject,
  onSubjectChange,
  onContinue,
  onBack,
}: {
  selectedTemplate: Template | null;
  subject: string;
  onSubjectChange: (s: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [templateJson, setTemplateJson] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch session token and full template data in parallel
  useEffect(() => {
    setLoading(true);
    setError("");

    const promises: Promise<void>[] = [
      fetch("/api/email/session")
        .then((r) => {
          if (!r.ok) throw new Error("Oturum oluşturulamadı");
          return r.json();
        })
        .then((data) => setSessionToken(data.sessionToken)),
    ];

    // Fetch full template json_data if we have an ID
    if (selectedTemplate?.id) {
      promises.push(
        fetch(`/api/email/templates/${selectedTemplate.id}`)
          .then((r) => {
            if (!r.ok) throw new Error("Şablon yüklenemedi");
            return r.json();
          })
          .then((data) => setTemplateJson(data.json_data || null))
      );
    }

    Promise.all(promises)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedTemplate?.id]);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/email/session");
      if (!res.ok) throw new Error("Oturum oluşturulamadı");
      const data = await res.json();
      setSessionToken(data.sessionToken);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (e.data?.source !== "mailcraft") return;

      if (e.data.type === "MAILCRAFT_ERROR") {
        if (e.data.payload?.code === "AUTH_ERROR") {
          fetchSession();
        }
      }

      if (e.data.type === "MAILCRAFT_READY" && templateJson) {
        iframeRef.current?.contentWindow?.postMessage(
          {
            source: "mailcraft-host",
            type: "MAILCRAFT_LOAD_TEMPLATE",
            payload: { json: templateJson },
          },
          MAILCRAFT_ORIGIN
        );
      }
    };

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [templateJson, fetchSession]);

  if (loading) {
    return (
      <div className="text-center py-24 text-on-surface-variant lowercase">
        düzenleyici yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-error lowercase mb-4">{error}</p>
        <button
          onClick={fetchSession}
          className="text-primary text-sm font-bold lowercase underline"
        >
          tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subject input */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
          konu
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="e-posta konusu..."
          className="w-full border border-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Builder iframe */}
      {sessionToken && (
        <iframe
          ref={iframeRef}
          src={`${MAILCRAFT_ORIGIN}/builder/?sessionToken=${sessionToken}&showLogo=false&themeMode=light`}
          style={{ width: "100%", height: "800px", border: "none" }}
          allow="clipboard-write"
        />
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors lowercase"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          geri
        </button>
        <button
          onClick={onContinue}
          disabled={!subject.trim()}
          className="bg-primary text-on-primary px-6 py-3 text-sm font-bold lowercase tracking-tight hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          devam
        </button>
      </div>
    </div>
  );
}

// --- Step 3: Recipients ---

function RecipientsStep({
  members,
  selectedMembers,
  onSelectionChange,
  onContinue,
  onBack,
}: {
  members: Member[];
  selectedMembers: Member[];
  onSelectionChange: (m: Member[]) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.name && m.name.toLowerCase().includes(q))
    );
  }, [members, search]);

  const selectedIds = new Set(selectedMembers.map((m) => m.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  const toggleMember = (member: Member) => {
    if (selectedIds.has(member.id)) {
      onSelectionChange(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      onSelectionChange([...selectedMembers, member]);
    }
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filtered.map((m) => m.id));
      onSelectionChange(selectedMembers.filter((m) => !filteredIds.has(m.id)));
    } else {
      const existing = new Set(selectedMembers.map((m) => m.id));
      const toAdd = filtered.filter((m) => !existing.has(m.id));
      onSelectionChange([...selectedMembers, ...toAdd]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="isim veya e-posta ile ara..."
          className="w-full border border-surface-container pl-10 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Select all */}
      <div className="flex items-center justify-between border-b border-surface-container pb-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAll}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm font-bold text-on-surface-variant lowercase">
            tümünü seç
          </span>
        </label>
        <span className="text-xs text-primary font-semibold">
          {selectedMembers.length} / {members.length} üye seçildi
        </span>
      </div>

      {/* Member list */}
      <div className="max-h-96 overflow-y-auto space-y-1">
        {filtered.map((member) => (
          <label
            key={member.id}
            className="flex items-center gap-4 px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer border-b border-surface-container-highest/30"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(member.id)}
              onChange={() => toggleMember(member)}
              className="w-4 h-4 accent-primary shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-on-surface font-medium truncate block">
                {member.email}
              </span>
              {member.name && (
                <span className="text-xs text-on-surface-variant lowercase truncate block">
                  {member.name}
                </span>
              )}
            </div>
          </label>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant lowercase">
            sonuç bulunamadı.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors lowercase"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          geri
        </button>
        <button
          onClick={onContinue}
          disabled={selectedMembers.length === 0}
          className="bg-primary text-on-primary px-6 py-3 text-sm font-bold lowercase tracking-tight hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          devam
        </button>
      </div>
    </div>
  );
}

// --- Step 4: Review & Send ---

function ReviewStep({
  templateName,
  subject,
  recipientCount,
  sendStatus,
  sendError,
  onSend,
  onBack,
  onGoToHistory,
}: {
  templateName: string;
  subject: string;
  recipientCount: number;
  sendStatus: "idle" | "sending" | "sent" | "error";
  sendError: string;
  onSend: () => void;
  onBack: () => void;
  onGoToHistory: () => void;
}) {
  if (sendStatus === "sent") {
    return (
      <div className="text-center py-24">
        <span className="material-symbols-outlined text-primary text-6xl block mb-4">
          check_circle
        </span>
        <p className="text-lg font-bold text-on-surface lowercase mb-2">
          kampanya gönderildi!
        </p>
        <button
          onClick={onGoToHistory}
          className="text-primary text-sm font-bold lowercase underline"
        >
          gönderim geçmişine git
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="border border-surface-container bg-white p-8 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
          özet
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
              şablon
            </span>
            <p className="text-sm text-on-surface font-medium lowercase">
              {templateName}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
              konu
            </span>
            <p className="text-sm text-on-surface font-medium">{subject}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
              alıcı
            </span>
            <p className="text-sm text-on-surface font-medium">
              {recipientCount} üye
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {sendStatus === "error" && (
        <div className="border border-error/30 bg-error/5 px-4 py-3 text-sm text-error lowercase">
          {sendError}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={onBack}
          disabled={sendStatus === "sending"}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors lowercase disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          geri
        </button>
        <button
          onClick={onSend}
          disabled={sendStatus === "sending"}
          className="bg-primary text-on-primary px-8 py-3 text-sm font-bold lowercase tracking-tight hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sendStatus === "sending" ? "gönderiliyor..." : "gönder"}
        </button>
      </div>
    </div>
  );
}

// --- Send History ---

function SendHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/email/campaigns")
      .then((r) => r.json())
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-24 text-on-surface-variant lowercase">
        yükleniyor...
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-24">
        <span className="material-symbols-outlined text-outline/30 text-7xl">
          campaign
        </span>
        <p className="text-on-surface-variant mt-4 lowercase">
          henüz gönderim bulunmuyor
        </p>
      </div>
    );
  }

  const STATUS_LABELS: Record<string, string> = {
    sending: "gönderiliyor",
    sent: "gönderildi",
    partial: "kısmen",
    failed: "başarısız",
  };

  const STATUS_COLORS: Record<string, string> = {
    sending: "bg-secondary-container text-on-secondary-container",
    sent: "bg-primary text-on-primary",
    partial: "bg-tertiary text-on-tertiary",
    failed: "bg-error text-on-error",
  };

  return (
    <div className="space-y-2">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-surface-container">
        <div className="col-span-3">şablon</div>
        <div className="col-span-3">konu</div>
        <div className="col-span-2">alıcı</div>
        <div className="col-span-2">durum</div>
        <div className="col-span-2">tarih</div>
      </div>

      {/* Rows */}
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-surface-container-highest/30"
        >
          <div className="col-span-3 text-sm text-on-surface font-medium truncate lowercase">
            {campaign.templateName}
          </div>
          <div className="col-span-3 text-sm text-on-surface-variant truncate">
            {campaign.subject}
          </div>
          <div className="col-span-2 text-sm text-on-surface-variant">
            {campaign.successCount}/{campaign.recipientCount}
          </div>
          <div className="col-span-2">
            <span
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                STATUS_COLORS[campaign.status] || ""
              }`}
            >
              {STATUS_LABELS[campaign.status] || campaign.status}
            </span>
          </div>
          <div className="col-span-2 text-xs text-on-surface-variant">
            {campaign.sentAt
              ? new Date(campaign.sentAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : new Date(campaign.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
          </div>
        </div>
      ))}
    </div>
  );
}
