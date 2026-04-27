import type Database from "better-sqlite3";
import type { UserRow } from "../types/domain.js";

const now = () => Date.now();

export class UserRepository {
  constructor(private readonly db: Database.Database) {}

  findByOpenid(openid: string): UserRow | undefined {
    const row = this.db
      .prepare(`SELECT * FROM users WHERE openid = ?`)
      .get(openid) as UserRow | undefined;
    return row;
  }

  findById(id: number): UserRow | undefined {
    return this.db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as UserRow | undefined;
  }

  create(openid: string, unionid: string | null): UserRow {
    const t = now();
    const info = this.db
      .prepare(
        `INSERT INTO users (openid, unionid, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      )
      .run(openid, unionid, t, t);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  touch(id: number): void {
    this.db.prepare(`UPDATE users SET updated_at = ? WHERE id = ?`).run(now(), id);
  }

  updateNickname(id: number, nickname: string | null): UserRow | undefined {
    const t = now();
    this.db.prepare(`UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?`).run(
      nickname,
      t,
      id,
    );
    return this.findById(id);
  }
}
