export const INIT_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT NOT NULL UNIQUE,
  unionid TEXT,
  nickname TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_salary REAL NOT NULL DEFAULT 0,
  work_days_per_month REAL NOT NULL DEFAULT 21.75,
  work_hours_per_day REAL NOT NULL DEFAULT 8,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS poop_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  earned_money REAL NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_poop_records_user_end ON poop_records(user_id, end_time DESC);
`;
