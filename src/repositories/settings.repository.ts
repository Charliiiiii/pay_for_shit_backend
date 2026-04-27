import type Database from "better-sqlite3";
import type { UserSettingsRow } from "../types/domain.js";

const now = () => Date.now();

export class SettingsRepository {
  constructor(private readonly db: Database.Database) {}

  getByUserId(userId: number): UserSettingsRow | undefined {
    return this.db
      .prepare(`SELECT * FROM user_settings WHERE user_id = ?`)
      .get(userId) as UserSettingsRow | undefined;
  }

  upsert(
    userId: number,
    data: {
      monthly_salary: number;
      work_days_per_month: number;
      work_hours_per_day: number;
    },
  ): UserSettingsRow {
    const t = now();
    this.db
      .prepare(
        `INSERT INTO user_settings (user_id, monthly_salary, work_days_per_month, work_hours_per_day, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           monthly_salary = excluded.monthly_salary,
           work_days_per_month = excluded.work_days_per_month,
           work_hours_per_day = excluded.work_hours_per_day,
           updated_at = excluded.updated_at`,
      )
      .run(
        userId,
        data.monthly_salary,
        data.work_days_per_month,
        data.work_hours_per_day,
        t,
      );
    return this.getByUserId(userId)!;
  }

  ensureDefaults(userId: number): UserSettingsRow {
    const existing = this.getByUserId(userId);
    if (existing) return existing;
    return this.upsert(userId, {
      monthly_salary: 0,
      work_days_per_month: 21.75,
      work_hours_per_day: 8,
    });
  }
}
