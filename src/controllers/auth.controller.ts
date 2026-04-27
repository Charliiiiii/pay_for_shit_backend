import type { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service.js";

const loginBody = z.object({ code: z.string().min(1) });

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  wechatLogin = async (req: Request, res: Response) => {
    const { code } = loginBody.parse(req.body);
    const { token, userId } = await this.auth.loginWithCode(code);
    res.json({
      status: "ok",
      data: { token, userId },
    });
  };
}
