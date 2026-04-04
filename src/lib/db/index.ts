import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { migrate } from "./migrate";

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _migrated = false;

function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  // Ensure tables exist before first query (Turbopack may skip instrumentation hook)
  if (!_migrated) {
    migrate();
    _migrated = true;
  }

  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/zeyneple.db";
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  _db = drizzle(sqlite, { schema });
  return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});
