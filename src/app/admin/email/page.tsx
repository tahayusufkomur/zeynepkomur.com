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
