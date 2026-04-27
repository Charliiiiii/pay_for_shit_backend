import type { Request, Response } from "express";
import { z } from "zod";
import { LeaderboardService } from "../services/leaderboard.service.js";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  includeSelf: z
    .union([z.string(), z.boolean(), z.undefined()])
    .optional()
    .transform((v) => !(v === "0" || v === "false" || v === false)),
});

export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  week = async (req: Request, res: Response) => {
    const q = querySchema.parse(req.query);
    const now = Date.now();
    let rows;
    if (req.userId != null && q.includeSelf) {
      rows = this.leaderboard.weekWithSelf(now, req.userId, q.limit);
    } else {
      rows = this.leaderboard.weekGlobal(now, req.userId ?? null, q.limit);
    }
    res.json({ status: "ok", data: { rows } });
  };
}
