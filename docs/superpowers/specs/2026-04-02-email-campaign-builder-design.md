# Email Campaign Builder — Design Spec

**Date:** 2026-04-02
**Status:** Approved

## Overview

Integrate Mailcraft (mailcraft.contentor.app) as an embeddable email template builder into the admin panel. Admins design emails via drag-and-drop, select club members as recipients, and send campaigns — all from a single page.

## Flow

1. Admin navigates to `/admin/email`
2. Selects a template from saved templates or Mailcraft gallery (or starts blank)
3. Opens the Mailcraft builder (iframe) to edit/customize the template
4. Enters a subject line
5. Selects recipients from club members (search/filter + select all)
6. Reviews summary and sends
7. Campaign is logged in send history

## Database

### New table: `emailCampaigns`

| Column | Type | Description |
|--------|------|-------------|
| id | text (UUID, PK) | Primary key |
| templateId | text | Mailcraft template ID |
| templateName | text | Snapshot of template name at send time |
| subject | text | Email subject line |
| recipientCount | integer | Total number of recipients |
| successCount | integer | Number of successfully sent emails |
| recipients | text (JSON) | Array of `{ email, name }` |
| status | text (enum) | `"sending"`, `"sent"`, `"partial"`, `"failed"` |
| sentAt | text (datetime) | Set when campaign finishes sending (not at creation) |
| createdAt | text (datetime) | Record creation time |

Status semantics: `"sent"` = all delivered, `"partial"` = some succeeded (check `successCount`), `"failed"` = none delivered. Per-recipient delivery tracking is out of scope for v1; failed campaigns must be investigated manually or resent to all recipients.

No template HTML stored locally — Mailcraft manages templates. We store `templateId` for reference and `templateName` as a snapshot for history display.

### Implementation notes

- Add Drizzle schema definition to `src/lib/db/schema.ts` using `sqliteTable()`, following existing patterns (text PKs with UUID, snake_case columns, `sql\`(datetime('now'))\`` defaults)
- Add `CREATE TABLE IF NOT EXISTS email_campaigns` to `src/lib/db/migrate.ts`, matching the hand-rolled migration pattern used by the project

## API Routes

All routes require admin authentication (`requireAdmin()`). Mailcraft API key stays server-side.

### `GET /api/email/session`

Creates a Mailcraft session token for secure iframe embedding.

- Calls `POST https://mailcraft.contentor.app/api/v1/auth/session` with `X-API-Key` header
- Returns `{ sessionToken }` to frontend
- Session tokens expire after 4 hours

### `GET /api/email/templates`

Lists available templates.

- Proxies to Mailcraft `GET /api/v1/templates` (saved templates)
- Also fetches `GET /api/v1/gallery` (pre-built gallery templates)
- Returns combined list with `{ id, name, category, isGallery }` for each

### `POST /api/email/render`

Renders a template with variables (for preview).

- Body: `{ templateId, variables: { name, email } }`
- Calls Mailcraft `POST /api/v1/render`
- Returns rendered HTML

### `POST /api/email/send`

Sends the campaign. Max 500 recipients per campaign.

- Body: `{ templateId, templateName, subject, recipients: [{ email, name }] }`
- Flow:
  1. Creates `emailCampaigns` record with status `"sending"`
  2. Renders template once via Mailcraft render API with placeholder values
  3. For each recipient, substitutes `{{name}}` and `{{email}}` in the rendered HTML server-side (simple string replacement — avoids N render API calls)
  4. Sends emails via Resend batch API (`resend.batch.send()`, up to 100 per batch call) using existing `EMAIL_FROM` env var as sender
  5. Updates campaign: `status` to `"sent"` / `"partial"` / `"failed"`, sets `successCount` and `sentAt`
- Returns `{ campaignId, status }`

### `GET /api/email/campaigns`

Returns send history.

- Queries `emailCampaigns` table ordered by `sentAt` desc
- Returns list of `{ id, templateName, subject, recipientCount, status, sentAt }`

## Admin UI

### Page: `/admin/email`

Two tabs at the top: **Yeni E-posta** (New Email) and **Gönderim Geçmişi** (Send History).

### New Email — 4-step wizard

Step indicator at the top: `Şablon → Düzenle → Alıcılar → Gönder`

**Step 1: Template (Şablon)**

- Grid of template cards with names (and thumbnails if available via preview endpoint)
- Two sections: "Kayıtlı Şablonlar" (saved) and "Galeri" (gallery)
- "Boş Başla" (Start Blank) option
- Click to select; selected card gets highlight border
- "Devam" (Continue) button

**Step 2: Editor (Düzenle)**

- Subject line text input above iframe: `<input>` for "Konu" (Subject)
- Full-width Mailcraft builder iframe, ~800px height
- Iframe uses session token auth (from `/api/email/session`)
- Fresh session token fetched each time this step is entered (avoids expiry issues)
- Selected template pre-loaded via `MAILCRAFT_LOAD_TEMPLATE` postMessage
- "Kaydet ve Devam" (Save & Continue) button triggers `MAILCRAFT_REQUEST_SAVE`
- Listens for `MAILCRAFT_TEMPLATE_SAVED` event to capture `templateId` and `templateName`
- If iframe reports auth error, auto-refresh session token and reinitialize
- Back button to return to template selection

**Step 3: Recipients (Alıcılar)**

- Club members fetched via existing `GET /api/newsletter` endpoint
- Search input at top — filters members by name or email (client-side)
- "Tümünü Seç" (Select All) checkbox
- Scrollable list of club members with checkboxes showing name + email
- Counter: "X / Y üye seçildi" (X of Y members selected)
- "Devam" button (disabled if no recipients selected)

**Step 4: Review & Send (Gönder)**

- Summary card showing:
  - Template name
  - Subject line
  - Recipient count
- "Gönder" (Send) button
- Loading state while sending
- Success state: "Kampanya gönderildi!" with link to send history
- Error state: error message with retry option

### Send History tab (Gönderim Geçmişi)

Table matching existing admin style (like members page):

| Column | Content |
|--------|---------|
| Şablon | Template name |
| Konu | Subject line |
| Alıcı | Recipient count |
| Durum | Status badge (sent/failed) |
| Tarih | Date, formatted Turkish locale |

Ordered by most recent first.

### UI patterns

- Follows existing admin conventions: same header with back arrow, `bg-background`, Material Symbols Outlined icons
- Lowercase Turkish text, same font/color system
- Grid/table styling consistent with members and submissions pages

## Environment Variables

```
MAILCRAFT_API_KEY=mc_live_...     # Server-side only, never exposed to browser
MAILCRAFT_ORIGIN=https://mailcraft.contentor.app  # Base URL for API + builder iframe
```

## Mailcraft Organization Config

- **Variables:** `name` (text, default: "there"), `email` (text) — available in builder dropdown
- **Allowed origin:** production domain for session token validation

## Architecture Notes

- The `/admin/email` page uses a server component for auth check, passing initial data (club members) as props to a client component that manages wizard state
- All text values (subject, templateName) rendered as text content in the admin UI — no `dangerouslySetInnerHTML` for these fields
- Rendered HTML from Mailcraft is trusted and sent as-is (trusted SaaS boundary)
- Update `.env.prod.example` with the new env vars
- No `next.config.ts` changes needed (no CSP headers currently in place)

## Error Handling

- All Mailcraft API calls catch errors and return `{ error: string }` with status 502 when Mailcraft is unreachable
- Frontend displays errors inline in the current wizard step
- Session token failures trigger auto-refresh

## Security

- API key never sent to browser — session tokens used for iframe
- All API routes admin-protected
- postMessage filtered by `source: "mailcraft"` / `source: "mailcraft-host"`
- `targetOrigin` set to Mailcraft origin in production (not `*`)

## Dependencies

- No new npm packages required
- Uses existing: Resend (email sending), Drizzle (DB), NextAuth (admin auth)
- Mailcraft accessed via iframe embed + REST API (no SDK needed for this integration)

## Out of Scope

- Scheduling emails for later
- A/B testing
- Email analytics (open/click tracking)

## Fast Follow (before bulk usage)

- **Unsubscribe handling** — add `{{unsubscribe_url}}` variable and unsubscribe endpoint. Required by GDPR/CAN-SPAM for marketing emails. V1 is suitable for small internal communications only.
