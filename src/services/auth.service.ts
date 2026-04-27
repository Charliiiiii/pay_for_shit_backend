import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { Env } from "../config/env.js";
import type { AccessTokenPayload } from "../types/domain.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SettingsRepository } from "../repositories/settings.repository.js";
import { UnauthorizedError } from "../utils/errors.js";
import { WechatService } from "./wechat.service.js";

export class AuthService {
  constructor(
    private readonly env: Env,
    private readonly users: UserRepository,
    private readonly settings: SettingsRepository,
    private readonly wechat: WechatService,
  ) {}

  async loginWithCode(code: string): Promise<{ token: string; userId: number }> {
    const { openid, unionid } = await this.wechat.code2Session(code);
    let user = this.users.findByOpenid(openid);
    if (!user) {
      user = this.users.create(openid, unionid);
      this.settings.ensureDefaults(user.id);
    } else {
      this.users.touch(user.id);
    }
    const secret: Secret = this.env.JWT_SECRET;
    const signOpts: SignOptions = {
      expiresIn: this.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };
    const token = jwt.sign({ userId: user.id } satisfies AccessTokenPayload, secret, signOpts);
    return { token, userId: user.id };
  }

  verifyToken(authorization: string | undefined): AccessTokenPayload {
    const raw = authorization?.replace(/^Bearer\s+/i, "");
    if (!raw) throw new UnauthorizedError("未提供 token");
    const secret: Secret = this.env.JWT_SECRET;
    try {
      const decoded = jwt.verify(raw, secret);
      if (typeof decoded !== "object" || decoded === null || !("userId" in decoded)) {
        throw new UnauthorizedError("无效 token");
      }
      const userId = Number((decoded as AccessTokenPayload).userId);
      if (!Number.isFinite(userId)) throw new UnauthorizedError("无效 token");
      return { userId, iat: (decoded as AccessTokenPayload).iat, exp: (decoded as AccessTokenPayload).exp };
    } catch (e) {
      if (e instanceof UnauthorizedError) throw e;
      throw new UnauthorizedError("无效 token");
    }
  }
}
