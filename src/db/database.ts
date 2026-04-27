import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { Env } from "../config/env.js";
import { INIT_SQL } from "./schema.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) throw new Error("Database not initialized");
  return db;
}

export function openDatabase(env: Env): Database.Database {
  const dir = path.dirname(path.resolve(env.DATABASE_PATH));
  fs.mkdirSync(dir, { recursive: true });
  const instance = new Database(env.DATABASE_PATH);
  instance.pragma("journal_mode = WAL");
  instance.exec(INIT_SQL);
  db = instance;
  return instance;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
