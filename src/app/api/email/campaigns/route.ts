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
