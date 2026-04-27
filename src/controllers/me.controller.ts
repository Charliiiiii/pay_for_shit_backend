import type { Request, Response } from "express";
import { z } from "zod";
import { UserRepository } from "../repositories/user.repository.js";
import { SettingsService } from "../services/settings.service.js";
import { RecordService } from "../services/record.service.js";

const settingsPut = z.object({
  monthlySalary: z.number().nonnegative(),
  workDaysPerMonth: z.number().positive().optional(),
  workHoursPerDay: z.number().min(0.5).max(24).optional(),
});

const profilePut = z.object({
  nickname: z.string().min(1).max(32),
});

const recordsPost = z.object({
  records: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        startTime: z.number().int(),
        endTime: z.number().int(),
        durationSeconds: z.number().int().nonnegative(),
        earnedMoney: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(500),
});

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export class MeController {
  constructor(
    private readonly users: UserRepository,
    private readonly settings: SettingsService,
    private readonly records: RecordService,
  ) {}

  profile = async (req: Request, res: Response) => {
    const userId = req.userId!;
    const user = this.users.findById(userId);
    res.json({
      status: "ok",
      data: {
        id: userId,
        nickname: user?.nickname ?? null,
      },
    });
  };

  putProfile = async (req: Request, res: Response) => {
    const userId = req.userId!;
    const body = profilePut.parse(req.body);
    const user = this.users.updateNickname(userId, body.nickname);
    res.json({
      status: "ok",
      data: { id: userId, nickname: user?.nickname ?? null },
    });
  };

  getSettings = async (req: Request, res: Response) => {
    const dto = this.settings.getForUser(req.userId!);
    res.json({ status: "ok", data: dto });
  };

  putSettings = async (req: Request, res: Response) => {
    const body = settingsPut.parse(req.body);
    const dto = this.settings.updateForUser(req.userId!, body);
    res.json({ status: "ok", data: dto });
  };

  listRecords = async (req: Request, res: Response) => {
    const q = listQuery.parse(req.query);
    const result = this.records.list(req.userId!, q.limit, q.offset);
    res.json({ status: "ok", data: result });
  };

  postRecords = async (req: Request, res: Response) => {
    recordsPost.parse(req.body);
    const result = this.records.upsertMany(req.userId!, req.body);
    res.status(201).json({ status: "ok", data: result });
  };

  deleteRecords = async (req: Request, res: Response) => {
    const result = this.records.clearAll(req.userId!);
    res.json({ status: "ok", data: result });
  };
}
