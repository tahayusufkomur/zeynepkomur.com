# Email Campaign Builder Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Mailcraft email template builder into the admin panel so admins can design emails, select club members, and send campaigns.

**Architecture:** Server component at `/admin/email` handles auth and passes club members to a client component managing a 4-step wizard (template → editor → recipients → review). Five API routes under `/api/email/` proxy Mailcraft APIs and handle campaign sending via Resend batch API. A new `emailCampaigns` SQLite table tracks send history.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM + SQLite, Resend (email), Mailcraft REST API + iframe embed, TypeScript.

**Spec:** `docs/superpowers/specs/2026-04-02-email-campaign-builder-design.md`

---

## File Structure

### New files
- `src/lib/db/schema.ts` — modify: add `emailCampaigns` table
- `src/lib/db/migrate.ts` — modify: add `CREATE TABLE IF NOT EXISTS email_campaigns`
- `src/lib/mailcraft.ts` — Mailcraft API client (session, templates, gallery, render)
- `src/app/api/email/session/route.ts` — GET: create Mailcraft session token
- `src/app/api/email/templates/route.ts` — GET: list templates + gallery
- `src/app/api/email/render/route.ts` — POST: render template preview
- `src/app/api/email/send/route.ts` — POST: send campaign
- `src/app/api/email/campaigns/route.ts` — GET: send history
- `src/app/admin/email/page.tsx` — server component (auth + data fetch)
- `src/app/admin/email/email-client.tsx` — client component (wizard + history)
- `.env.example` — modify: add Mailcraft env vars
- `.env.prod.example` — modify: add Mailcraft env vars

---

## Chunk 1: Database & Mailcraft Client

### Task 1: Add emailCampaigns schema + migration

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/migrate.ts`

- [ ] **Step 1: Add Drizzle schema definition**

Add to the end of `src/lib/db/schema.ts`:

```typescript
export const emailCampaigns = sqliteTable("email_campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id").notNull(),
  templateName: text("template_name").notNull(),
  subject: text("subject").notNull(),
  recipientCount: integer("recipient_count").notNull(),
  successCount: integer("success_count").notNull().default(0),
  recipients: text("recipients").notNull(),
  status: text("status", { enum: ["sending", "sent", "partial", "failed"] }).notNull().default("sending"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
```

- [ ] **Step 2: Add migration SQL**

Add to the end of the `sqlite.exec()` template string in `src/lib/db/migrate.ts`, before the closing backtick:

```sql
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      template_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      recipient_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL DEFAULT 0,
      recipients TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sending' CHECK(status IN ('sending', 'sent', 'partial', 'failed')),
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
```

- [ ] **Step 3: Verify migration runs**

Run: `npx tsx src/lib/db/migrate.ts`
Expected: `[migrate] Tables created/verified`

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/migrate.ts
git commit -m "feat(email): add emailCampaigns table schema and migration"
```

### Task 2: Create Mailcraft API client

**Files:**
- Create: `src/lib/mailcraft.ts`

- [ ] **Step 1: Create the Mailcraft client module**

Create `src/lib/mailcraft.ts`:

```typescript
const MAILCRAFT_ORIGIN = process.env.MAILCRAFT_ORIGIN || "https://mailcraft.contentor.app";
const MAILCRAFT_API_KEY = process.env.MAILCRAFT_API_KEY || "";

function apiUrl(path: string) {
  return `${MAILCRAFT_ORIGIN}/api/v1${path}`;
}

function headers() {
  return {
    "X-API-Key": MAILCRAFT_API_KEY,
    "Content-Type": "application/json",
  };
}

export async function createSession(origin: string) {
  const res = await fetch(apiUrl("/auth/session"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ origin }),
  });
  if (!res.ok) {
    throw new Error(`Mailcraft session error: ${res.status}`);
  }
  return res.json() as Promise<{ token: string; expires_at: string }>;
}

export type MailcraftTemplate = {
  id: string;
  name: string;
  category?: string;
  json_data?: unknown;
};

export async function listTemplates() {
  const res = await fetch(apiUrl("/templates"), { headers: headers() });
  if (!res.ok) {
    throw new Error(`Mailcraft templates error: ${res.status}`);
  }
  return res.json() as Promise<MailcraftTemplate[]>;
}

export async function listGallery() {
  const res = await fetch(apiUrl("/gallery"), { headers: headers() });
  if (!res.ok) {
    throw new Error(`Mailcraft gallery error: ${res.status}`);
  }
  return res.json() as Promise<MailcraftTemplate[]>;
}

export async function renderTemplate(templateId: string, variables: Record<string, string>) {
  const res = await fetch(apiUrl("/render"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ template_id: templateId, variables }),
  });
  if (!res.ok) {
    throw new Error(`Mailcraft render error: ${res.status}`);
  }
  return res.json() as Promise<{ html: string }>;
}

```

- [ ] **Step 2: Commit**

```bash
git add src/lib/mailcraft.ts
git commit -m "feat(email): add Mailcraft API client"
```

### Task 3: Add environment variables

**Files:**
- Modify: `.env.example`
- Modify: `.env.prod.example`

- [ ] **Step 1: Update .env.example**

Add to the end of `.env.example`:

```
MAILCRAFT_API_KEY=mc_live_xxxxxxxxxxxx
MAILCRAFT_ORIGIN=https://mailcraft.contentor.app
```

- [ ] **Step 2: Update .env.prod.example**

Add after the `EMAIL_FROM` line in `.env.prod.example`:

```
# Mailcraft (Email Builder)
MAILCRAFT_API_KEY=  # From https://mailcraft.contentor.app dashboard
MAILCRAFT_ORIGIN=https://mailcraft.contentor.app
```

- [ ] **Step 3: Commit**

```bash
git add .env.example .env.prod.example
git commit -m "feat(email): add Mailcraft env vars to examples"
```

---

## Chunk 2: API Routes

### Task 4: Session endpoint

**Files:**
- Create: `src/app/api/email/session/route.ts`

- [ ] **Step 1: Create the session route**

Create `src/app/api/email/session/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { createSession } from "@/lib/mailcraft";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const session = await createSession(origin);
    return NextResponse.json({ sessionToken: session.token });
  } catch (error) {
    console.error("[email/session] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/email/session/route.ts
git commit -m "feat(email): add session token endpoint"
```

### Task 5: Templates endpoint

**Files:**
- Create: `src/app/api/email/templates/route.ts`

- [ ] **Step 1: Create the templates route**

Create `src/app/api/email/templates/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { listTemplates, listGallery } from "@/lib/mailcraft";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [templates, gallery] = await Promise.all([
      listTemplates(),
      listGallery(),
    ]);

    const saved = templates.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category || null,
      isGallery: false,
    }));

    const galleryItems = gallery.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category || null,
      isGallery: true,
    }));

    return NextResponse.json([...saved, ...galleryItems]);
  } catch (error) {
    console.error("[email/templates] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/email/templates/route.ts
git commit -m "feat(email): add templates listing endpoint"
```

### Task 6: Render endpoint

**Files:**
- Create: `src/app/api/email/render/route.ts`

- [ ] **Step 1: Create the render route**

Create `src/app/api/email/render/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { renderTemplate } from "@/lib/mailcraft";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { templateId, variables } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: "templateId gerekli" }, { status: 400 });
    }

    const result = await renderTemplate(templateId, variables || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error("[email/render] Mailcraft error:", error);
    return NextResponse.json(
      { error: "Mailcraft servisi yanıt vermiyor" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/email/render/route.ts
git commit -m "feat(email): add template render endpoint"
```

### Task 7: Send endpoint

**Files:**
- Create: `src/app/api/email/send/route.ts`

- [ ] **Step 1: Create the send route**

Create `src/app/api/email/send/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/auth-guard";
import { renderTemplate } from "@/lib/mailcraft";
import { db } from "@/lib/db";
import { emailCampaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const MAX_RECIPIENTS = 500;
const BATCH_SIZE = 100;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}

function substituteVariables(html: string, variables: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    result = result.replace(pattern, value);
  }
  return result;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { templateId, templateName, subject, recipients } = await request.json();

    if (!templateId || !subject || !recipients?.length) {
      return NextResponse.json(
        { error: "templateId, subject ve recipients gerekli" },
        { status: 400 }
      );
    }

    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Maksimum ${MAX_RECIPIENTS} alıcı destekleniyor` },
        { status: 400 }
      );
    }

    // Create campaign record
    const campaignId = crypto.randomUUID();
    await db.insert(emailCampaigns).values({
      id: campaignId,
      templateId,
      templateName: templateName || "Untitled",
      subject,
      recipientCount: recipients.length,
      recipients: JSON.stringify(recipients),
      status: "sending",
    });

    // Render template once with placeholder values
    const { html: baseHtml } = await renderTemplate(templateId, {
      name: "{{name}}",
      email: "{{email}}",
    });

    const from = process.env.EMAIL_FROM || "noreply@zeynepkomur.com";
    const resend = getResend();
    let totalSuccess = 0;

    // Send in batches of 100
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      const emails = batch.map((r: { email: string; name: string | null }) => ({
        from,
        to: r.email,
        subject,
        html: substituteVariables(baseHtml, {
          name: r.name || "",
          email: r.email,
        }),
      }));

      try {
        await resend.batch.send(emails);
        totalSuccess += batch.length;
      } catch (error) {
        console.error(`[email/send] Batch ${i / BATCH_SIZE + 1} failed:`, error);
      }
    }

    // Determine final status
    let status: "sent" | "partial" | "failed";
    if (totalSuccess === recipients.length) {
      status = "sent";
    } else if (totalSuccess > 0) {
      status = "partial";
    } else {
      status = "failed";
    }

    await db
      .update(emailCampaigns)
      .set({
        status,
        successCount: totalSuccess,
        sentAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(emailCampaigns.id, campaignId));

    return NextResponse.json({ campaignId, status, successCount: totalSuccess });
  } catch (error) {
    console.error("[email/send] Error:", error);
    return NextResponse.json(
      { error: "Kampanya gönderilemedi" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/email/send/route.ts
git commit -m "feat(email): add campaign send endpoint with batch sending"
```

### Task 8: Campaigns history endpoint

**Files:**
- Create: `src/app/api/email/campaigns/route.ts`

- [ ] **Step 1: Create the campaigns route**

Create `src/app/api/email/campaigns/route.ts`:

```typescript
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { emailCampaigns } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const campaigns = await db
    .select({
      id: emailCampaigns.id,
      templateName: emailCampaigns.templateName,
      subject: emailCampaigns.subject,
      recipientCount: emailCampaigns.recipientCount,
      successCount: emailCampaigns.successCount,
      status: emailCampaigns.status,
      sentAt: emailCampaigns.sentAt,
      createdAt: emailCampaigns.createdAt,
    })
    .from(emailCampaigns)
    .orderBy(desc(emailCampaigns.createdAt));

  return NextResponse.json(campaigns);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/email/campaigns/route.ts
git commit -m "feat(email): add campaigns history endpoint"
```

---

## Chunk 3: Admin UI — Page Shell & Wizard State

### Task 9: Server component (auth + data)

**Files:**
- Create: `src/app/admin/email/page.tsx`

- [ ] **Step 1: Create the server page component**

Create `src/app/admin/email/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { newsletterSubscribers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { EmailClient } from "./email-client";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const members = await db
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      name: newsletterSubscribers.name,
    })
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.subscribedAt));

  return <EmailClient members={members} userEmail={session.user.email || ""} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/email/page.tsx
git commit -m "feat(email): add admin email page server component"
```

### Task 10: Client component — full wizard + history

**Files:**
- Create: `src/app/admin/email/email-client.tsx`

- [ ] **Step 1: Create the client component**

Create `src/app/admin/email/email-client.tsx`. This is the main file — it contains the wizard state machine, all four steps, and the send history tab.

```typescript
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";

// --- Types ---

type Member = { id: string; email: string; name: string | null };

type Template = {
  id: string;
  name: string;
  category: string | null;
  isGallery: boolean;
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
      <div className="max-w-5xl mx-auto px-8 py-8">
        {activeTab === "new" ? (
          <NewEmailWizard members={members} onSent={() => setActiveTab("history")} />
        ) : (
          <SendHistory />
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
          onSaved={(id, name) => {
            setTemplateId(id);
            setTemplateName(name);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <RecipientsStep
          members={members}
          selectedMembers={selectedMembers}
          onSelectionChange={setSelectedMembers}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
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
      )}
    </div>
  );
}

// --- Step 1: Templates ---

function TemplateStep({ onSelect }: { onSelect: (t: Template) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/email/templates")
      .then((r) => {
        if (!r.ok) throw new Error("Şablonlar yüklenemedi");
        return r.json();
      })
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  const saved = templates.filter((t) => !t.isGallery);
  const gallery = templates.filter((t) => t.isGallery);

  return (
    <div className="space-y-8">
      {/* Start blank */}
      <button
        onClick={() => onSelect({ id: "", name: "Boş Şablon", category: null, isGallery: false })}
        className="w-full border-2 border-dashed border-surface-container hover:border-primary py-12 text-on-surface-variant hover:text-primary transition-colors lowercase font-bold tracking-tight"
      >
        <span className="material-symbols-outlined text-3xl block mb-2">add</span>
        boş başla
      </button>

      {/* Saved templates */}
      {saved.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            kayıtlı şablonlar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {saved.map((t) => (
              <TemplateCard key={t.id} template={t} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
            galeri
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((t) => (
              <TemplateCard key={t.id} template={t} onSelect={onSelect} />
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
}: {
  template: Template;
  onSelect: (t: Template) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="border border-surface-container hover:border-primary bg-white p-6 text-left transition-colors group"
    >
      <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 group-hover:text-primary/50 transition-colors block mb-3">
        mail
      </span>
      <p className="text-sm font-semibold text-on-surface lowercase truncate">
        {template.name}
      </p>
      {template.category && (
        <p className="text-xs text-on-surface-variant mt-1 lowercase">
          {template.category}
        </p>
      )}
    </button>
  );
}

// --- Step 2: Editor ---

function EditorStep({
  selectedTemplate,
  subject,
  onSubjectChange,
  onSaved,
  onBack,
}: {
  selectedTemplate: Template | null;
  subject: string;
  onSubjectChange: (s: string) => void;
  onSaved: (templateId: string, templateName: string) => void;
  onBack: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email/session");
      if (!res.ok) throw new Error("Oturum oluşturulamadı");
      const data = await res.json();
      setSessionToken(data.sessionToken);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (e.data?.source !== "mailcraft") return;

      if (e.data.type === "MAILCRAFT_TEMPLATE_SAVED") {
        setSaving(false);
        onSaved(
          e.data.payload.templateId,
          e.data.payload.templateName
        );
      }

      if (e.data.type === "MAILCRAFT_ERROR") {
        setSaving(false);
        if (e.data.payload?.code === "AUTH_ERROR") {
          fetchSession();
        }
      }

      if (e.data.type === "MAILCRAFT_READY" && selectedTemplate?.id) {
        // Load the selected template into the builder
        iframeRef.current?.contentWindow?.postMessage(
          {
            source: "mailcraft-host",
            type: "MAILCRAFT_LOAD_TEMPLATE",
            payload: { templateId: selectedTemplate.id },
          },
          MAILCRAFT_ORIGIN
        );
      }
    };

    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [selectedTemplate, onSaved, fetchSession]);

  const requestSave = () => {
    setSaving(true);
    iframeRef.current?.contentWindow?.postMessage(
      { source: "mailcraft-host", type: "MAILCRAFT_REQUEST_SAVE" },
      MAILCRAFT_ORIGIN
    );
  };

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
          onClick={requestSave}
          disabled={saving || !subject.trim()}
          className="bg-primary text-on-primary px-6 py-3 text-sm font-bold lowercase tracking-tight hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "kaydediliyor..." : "kaydet ve devam"}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/email/email-client.tsx
git commit -m "feat(email): add admin email wizard client component"
```

---

## Chunk 4: Verification

### Task 11: Build verification

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Run migration to ensure table is created**

Run: `npx tsx src/lib/db/migrate.ts`
Expected: `[migrate] Tables created/verified`

- [ ] **Step 3: Start dev server and verify page loads**

Run: `npm run dev`
Then navigate to `http://localhost:3000/admin/email` (after logging in).
Expected: Page loads with the "yeni e-posta" and "gönderim geçmişi" tabs visible.

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(email): build fixes"
```
