import { Router } from "express";
import type { AuthService } from "../services/auth.service.js";
import type { SettingsService } from "../services/settings.service.js";
import type { RecordService } from "../services/record.service.js";
import type { LeaderboardService } from "../services/leaderboard.service.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { AuthController } from "../controllers/auth.controller.js";
import { MeController } from "../controllers/me.controller.js";
import { LeaderboardController } from "../controllers/leaderboard.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/error-handler.js";

export type RouteDeps = {
  authService: AuthService;
  settingsService: SettingsService;
  recordService: RecordService;
  leaderboardService: LeaderboardService;
  userRepository: UserRepository;
};

export function createRouter(deps: RouteDeps): Router {
  const r = Router();
  const authMw = requireAuth(deps.authService);
  const optAuth = optionalAuth(deps.authService);

  const authController = new AuthController(deps.authService);
  const meController = new MeController(
    deps.userRepository,
    deps.settingsService,
    deps.recordService,
  );
  const lbController = new LeaderboardController(deps.leaderboardService);

  r.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "pay-for-shit-backend" });
  });

  r.post("/api/v1/auth/wechat", asyncHandler(authController.wechatLogin));

  r.get("/api/v1/me", authMw, asyncHandler(meController.profile));
  r.put("/api/v1/me/profile", authMw, asyncHandler(meController.putProfile));
  r.get("/api/v1/me/settings", authMw, asyncHandler(meController.getSettings));
  r.put("/api/v1/me/settings", authMw, asyncHandler(meController.putSettings));
  r.get("/api/v1/me/records", authMw, asyncHandler(meController.listRecords));
  r.post("/api/v1/me/records", authMw, asyncHandler(meController.postRecords));
  r.delete("/api/v1/me/records", authMw, asyncHandler(meController.deleteRecords));

  r.get("/api/v1/leaderboard/week", optAuth, asyncHandler(lbController.week));

  return r;
}
