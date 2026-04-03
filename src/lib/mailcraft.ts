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

function extractArray(data: unknown): MailcraftTemplate[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    // Handle wrapped responses like { results: [...] } or { templates: [...] }
    for (const val of Object.values(data)) {
      if (Array.isArray(val)) return val;
    }
  }
  return [];
}

export async function listTemplates() {
  const res = await fetch(apiUrl("/templates"), { headers: headers() });
  if (!res.ok) {
    throw new Error(`Mailcraft templates error: ${res.status}`);
  }
  const data = await res.json();
  return extractArray(data);
}

export async function listGallery() {
  const res = await fetch(apiUrl("/gallery"), { headers: headers() });
  if (!res.ok) {
    throw new Error(`Mailcraft gallery error: ${res.status}`);
  }
  const data = await res.json();
  return extractArray(data);
}

export async function getTemplate(id: string) {
  const res = await fetch(apiUrl(`/templates/${id}`), { headers: headers() });
  if (!res.ok) {
    throw new Error(`Mailcraft get template error: ${res.status}`);
  }
  return res.json() as Promise<MailcraftTemplate>;
}

export async function getTemplatePreview(id: string) {
  const res = await fetch(apiUrl(`/templates/${id}/preview`), { headers: headers() });
  if (!res.ok) {
    throw new Error(`Mailcraft preview error: ${res.status}`);
  }
  return res.json() as Promise<{ html: string }>;
}

export async function createTemplate(name: string, json_data: unknown) {
  const res = await fetch(apiUrl("/templates"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, json_data }),
  });
  if (!res.ok) {
    throw new Error(`Mailcraft create template error: ${res.status}`);
  }
  return res.json() as Promise<MailcraftTemplate>;
}

export async function updateTemplate(id: string, name: string, json_data: unknown) {
  const res = await fetch(apiUrl(`/templates/${id}`), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({ name, json_data }),
  });
  if (!res.ok) {
    throw new Error(`Mailcraft update template error: ${res.status}`);
  }
  return res.json() as Promise<MailcraftTemplate>;
}

export async function deleteTemplate(id: string) {
  const res = await fetch(apiUrl(`/templates/${id}`), {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    throw new Error(`Mailcraft delete template error: ${res.status}`);
  }
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
