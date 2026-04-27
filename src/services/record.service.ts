import { z } from "zod";
import { earnedMoney, roundMoney } from "../utils/calc.js";
import { RecordRepository, type RecordInput } from "../repositories/record.repository.js";
import { SettingsRepository } from "../repositories/settings.repository.js";
import { ValidationError } from "../utils/errors.js";

const recordSchema = z.object({
  id: z.string().min(1).optional(),
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive(),
  durationSeconds: z.number().int().nonnegative(),
  earnedMoney: z.number().nonnegative(),
});

export class RecordService {
  constructor(
    private readonly records: RecordRepository,
    private readonly settingsRepo: SettingsRepository,
  ) {}

  list(userId: number, limit: number, offset: number) {
    const rows = this.records.listByUser(userId, limit, offset);
    const total = this.records.countByUser(userId);
    return {
      total,
      items: rows.map((r) => ({
        id: r.client_id || String(r.id),
        dbId: r.id,
        startTime: r.start_time,
        endTime: r.end_time,
        durationSeconds: r.duration_seconds,
        earnedMoney: roundMoney(r.earned_money),
      })),
    };
  }

  upsertMany(userId: number, payload: unknown): { inserted: number; skipped: number } {
    const body = z.object({ records: z.array(recordSchema).max(500) }).parse(payload);
    const settings = this.settingsRepo.ensureDefaults(userId);
    let inserted = 0;
    let skipped = 0;

    for (const rec of body.records) {
      const expected = earnedMoney(
        rec.durationSeconds,
        settings.monthly_salary,
        settings.work_hours_per_day,
      );
      if (Math.abs(expected - rec.earnedMoney) > 0.05) {
        throw new ValidationError("earnedMoney 与服务端根据当前保存的月薪重算结果不一致（请先同步设置）", [
          {
            field: "earnedMoney",
            message: `期望约 ${expected}，收到 ${rec.earnedMoney}`,
          },
        ]);
      }
      const input: RecordInput = {
        clientId: rec.id ?? null,
        startTime: rec.startTime,
        endTime: rec.endTime,
        durationSeconds: rec.durationSeconds,
        earnedMoney: roundMoney(rec.earnedMoney),
      };
      const { inserted: ins } = this.records.insertIgnoreDuplicate(userId, input);
      if (ins) inserted += 1;
      else skipped += 1;
    }
    return { inserted, skipped };
  }

  clearAll(userId: number): { deleted: number } {
    const deleted = this.records.deleteAllByUser(userId);
    return { deleted };
  }
}
