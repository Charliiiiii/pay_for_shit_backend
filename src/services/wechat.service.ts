import type { Env } from "../config/env.js";
import { BadGatewayError, ValidationError } from "../utils/errors.js";

type Code2SessionOk = {
  openid: string;
  session_key: string;
  unionid?: string;
};

type Code2SessionErr = {
  errcode: number;
  errmsg: string;
};

export class WechatService {
  constructor(private readonly env: Env) {}

  async code2Session(code: string): Promise<{ openid: string; unionid: string | null }> {
    if (!code || typeof code !== "string") {
      throw new ValidationError("缺少 code");
    }

    if (this.env.DEV_SKIP_WECHAT && this.env.NODE_ENV === "development") {
      return {
        openid: `dev_${code.slice(0, 32)}`,
        unionid: null,
      };
    }

    if (!this.env.WECHAT_APPID || !this.env.WECHAT_SECRET) {
      throw new ValidationError("服务端未配置 WECHAT_APPID / WECHAT_SECRET");
    }

    const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
    url.searchParams.set("appid", this.env.WECHAT_APPID);
    url.searchParams.set("secret", this.env.WECHAT_SECRET);
    url.searchParams.set("js_code", code);
    url.searchParams.set("grant_type", "authorization_code");

    const res = await fetch(url);
    if (!res.ok) {
      throw new BadGatewayError("微信接口请求失败");
    }

    const data = (await res.json()) as Code2SessionOk & Code2SessionErr;
    if ("errcode" in data && data.errcode) {
      throw new ValidationError(`微信登录失败: ${data.errmsg || data.errcode}`);
    }
    if (!data.openid) {
      throw new BadGatewayError("微信未返回 openid");
    }
    return { openid: data.openid, unionid: data.unionid ?? null };
  }
}
