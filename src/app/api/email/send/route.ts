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
