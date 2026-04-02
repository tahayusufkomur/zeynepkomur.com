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
