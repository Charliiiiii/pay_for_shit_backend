import type Database from "better-sqlite3";
import type { PoopRecordRow } from "../types/domain.js";

const now = () => Date.now();

export type RecordInput = {
  clientId: string | null;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  earnedMoney: number;
};

export class RecordRepository {
  constructor(private readonly db: Database.Database) {}

  listByUser(userId: number, limit: number, offset: number): PoopRecordRow[] {
    return this.db
      .prepare(
        `SELECT * FROM poop_records WHERE user_id = ? ORDER BY end_time DESC LIMIT ? OFFSET ?`,
      )
      .all(userId, limit, offset) as PoopRecordRow[];
  }

  countByUser(userId: number): number {
    const row = this.db
      .prepare(`SELECT COUNT(*) as c FROM poop_records WHERE user_id = ?`)
      .get(userId) as { c: number };
    return row.c;
  }

  /** 插入或忽略（同 user + client_id） */
  insertIgnoreDuplicate(userId: number, r: RecordInput): { inserted: boolean; row: PoopRecordRow } {
    const t = now();
    if (r.clientId) {
      const info = this.db
        .prepare(
          `INSERT OR IGNORE INTO poop_records (user_id, client_id, start_time, end_time, duration_seconds, earned_money, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          userId,
          r.clientId,
          r.startTime,
          r.endTime,
          r.durationSeconds,
          r.earnedMoney,
          t,
        );
      if (info.changes > 0) {
        const row = this.db
          .prepare(
            `SELECT * FROM poop_records WHERE user_id = ? AND client_id = ?`,
          )
          .get(userId, r.clientId) as PoopRecordRow;
        return { inserted: true, row };
      }
      const row = this.db
        .prepare(`SELECT * FROM poop_records WHERE user_id = ? AND client_id = ?`)
        .get(userId, r.clientId) as PoopRecordRow;
      return { inserted: false, row };
    }

    const info = this.db
      .prepare(
        `INSERT INTO poop_records (user_id, client_id, start_time, end_time, duration_seconds, earned_money, created_at)
         VALUES (?, NULL, ?, ?, ?, ?, ?)`,
      )
      .run(userId, r.startTime, r.endTime, r.durationSeconds, r.earnedMoney, t);
    const row = this.db
      .prepare(`SELECT * FROM poop_records WHERE id = ?`)
      .get(info.lastInsertRowid) as PoopRecordRow;
    return { inserted: true, row };
  }

  deleteAllByUser(userId: number): number {
    const info = this.db.prepare(`DELETE FROM poop_records WHERE user_id = ?`).run(userId);
    return info.changes;
  }

  /** 本周 [weekStart, now] 内记录条数与金额汇总 */
  weekStats(userId: number, weekStart: number, weekEnd: number): { sessions: number; earned: number } {
    const row = this.db
      .prepare(
        `SELECT COUNT(*) as c, COALESCE(SUM(earned_money), 0) as s
         FROM poop_records
         WHERE user_id = ? AND end_time >= ? AND end_time <= ?`,
      )
      .get(userId, weekStart, weekEnd) as { c: number; s: number };
    return { sessions: row.c, earned: row.s };
  }

  /** 全站周榜：按用户聚合 */
  leaderboardByWeek(weekStart: number, weekEnd: number, limit: number): {
    user_id: number;
    weekly: number;
    sessions: number;
    nickname: string | null;
  }[] {
    return this.db
      .prepare(
        `SELECT pr.user_id,
                ROUND(SUM(pr.earned_money), 2) as weekly,
                COUNT(*) as sessions,
                u.nickname
         FROM poop_records pr
         JOIN users u ON u.id = pr.user_id
         WHERE pr.end_time >= ? AND pr.end_time <= ?
         GROUP BY pr.user_id
         ORDER BY weekly DESC, sessions DESC
         LIMIT ?`,
      )
      .all(weekStart, weekEnd, limit) as {
      user_id: number;
      weekly: number;
      sessions: number;
      nickname: string | null;
    }[];
  }
}
