import { db } from "./db/index";
import { adminUsers } from "./db/schema";
import { seedPageContent } from "./db/seed";
import { migrate } from "./db/migrate";
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";

export async function bootstrap() {
  // Create tables if they don't exist
  migrate();

  await seedPageContent();

  const [{ total }] = await db.select({ total: count() }).from(adminUsers);

  if (total > 0) {
    console.log("[bootstrap] Admin user already exists, skipping");
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("[bootstrap] ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin creation");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(adminUsers).values({ email, passwordHash });
  console.log(`[bootstrap] Admin user created: ${email}`);
}
