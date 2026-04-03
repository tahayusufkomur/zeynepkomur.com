import { sqliteTable, text, integer, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const artworks = sqliteTable("artworks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", { enum: ["resim", "dekorasyon", "posterler"] }).notNull(),
  dimensions: text("dimensions").notNull().default(""),
  technique: text("technique").notNull().default(""),
  year: integer("year"),
  availability: text("availability", { enum: ["available", "sold", "contact"] }).notNull().default("available"),
  imagePath: text("image_path").notNull(),
  slug: text("slug").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const pageContent = sqliteTable("page_content", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageSlug: text("page_slug").notNull(),
  sectionKey: text("section_key").notNull(),
  content: text("content").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex("page_content_unique").on(table.pageSlug, table.sectionKey),
]);

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  templateType: text("template_type", { enum: ["grid", "showcase", "challenge"] }).notNull(),
  metadata: text("metadata").notNull().default("{}"),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const collectionArtworks = sqliteTable("collection_artworks", {
  collectionId: text("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  artworkId: text("artwork_id").notNull().references(() => artworks.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  dayNumber: integer("day_number"),
}, (table) => [
  primaryKey({ columns: [table.collectionId, table.artworkId] }),
]);

export const artworkImages = sqliteTable("artwork_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  artworkId: text("artwork_id").notNull().references(() => artworks.id, { onDelete: "cascade" }),
  imagePath: text("image_path").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const formSubmissions = sqliteTable("form_submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  formType: text("form_type", { enum: ["contact", "custom_request", "question"] }).notNull(),
  data: text("data").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribedAt: text("subscribed_at").notNull().default(sql`(datetime('now'))`),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
});

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
