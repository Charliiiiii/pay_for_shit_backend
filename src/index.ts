import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { openDatabase, closeDatabase } from "./db/database.js";
import { UserRepository } from "./repositories/user.repository.js";
import { SettingsRepository } from "./repositories/settings.repository.js";
import { RecordRepository } from "./repositories/record.repository.js";
import { WechatService } from "./services/wechat.service.js";
import { AuthService } from "./services/auth.service.js";
import { SettingsService } from "./services/settings.service.js";
import { RecordService } from "./services/record.service.js";
import { LeaderboardService } from "./services/leaderboard.service.js";
import { createApp } from "./app.js";

const env = loadEnv();
const db = openDatabase(env);

const userRepository = new UserRepository(db);
const settingsRepository = new SettingsRepository(db);
const recordRepository = new RecordRepository(db);
const wechatService = new WechatService(env);
const authService = new AuthService(env, userRepository, settingsRepository, wechatService);
const settingsService = new SettingsService(settingsRepository);
const recordService = new RecordService(recordRepository, settingsRepository);
const leaderboardService = new LeaderboardService(recordRepository, userRepository);

const app = createApp(env, {
  authService,
  settingsService,
  recordService,
  leaderboardService,
  userRepository,
});

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[pay-for-shit-backend] listening on :${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string) {
  console.log(`[shutdown] ${signal}`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
