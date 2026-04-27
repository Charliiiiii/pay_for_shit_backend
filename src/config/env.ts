import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  WECHAT_APPID: z.string().optional().default(""),
  WECHAT_SECRET: z.string().optional().default(""),
  JWT_SECRET: z.string().min(8, "JWT_SECRET 至少 8 字符"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  DATABASE_PATH: z.string().default("./data/app.db"),
  DEV_SKIP_WECHAT: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  ALLOWED_ORIGINS: z.string().optional().default(""),
});

export type Env = z.infer<typeof schema> & { allowedOriginsList: string[] };

export function loadEnv(): Env {
  const raw = schema.parse(process.env);
  const allowedOriginsList = raw.ALLOWED_ORIGINS
    ? raw.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return { ...raw, allowedOriginsList };
}
