import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { asyncHandler } from "./error-handler.js";

export function requireAuth(auth: AuthService) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const payload = auth.verifyToken(req.headers.authorization);
    req.userId = payload.userId;
    next();
  });
}

/** 有 token 则写入 userId，无则跳过 */
export function optionalAuth(auth: AuthService) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const raw = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!raw) return next();
    try {
      const payload = auth.verifyToken(req.headers.authorization);
      req.userId = payload.userId;
    } catch {
      /* 忽略无效 token，按匿名处理 */
    }
    next();
  });
}
