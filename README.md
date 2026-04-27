# 带薪噗噗计时器 · 后端

微信小程序「带薪噗噗计时器」的配套 API 服务：微信 `code` 登录、用户设置、噗噗记录同步、周榜聚合。技术栈为 **Node.js 18+**、**Express**、**TypeScript**、**SQLite**（`better-sqlite3`）。

## 环境要求

- Node.js **≥ 18**
- 生产环境建议设置 **`TZ=Asia/Shanghai`**，与小程序端「自然周」统计一致。

## 快速开始

```bash
cp .env.example .env
# 编辑 .env：至少配置 JWT_SECRET；正式登录需 WECHAT_APPID / WECHAT_SECRET

npm install
npm run dev
```

健康检查：<http://127.0.0.1:3000/health>（端口以 `.env` 中 `PORT` 为准）。

生产构建与运行：

```bash
npm run build
npm start
```

## 环境变量说明

| 变量 | 说明 |
|------|------|
| `PORT` | 监听端口，默认 `3000` |
| `NODE_ENV` | `development` / `production` |
| `WECHAT_APPID` / `WECHAT_SECRET` | 小程序后台「开发设置」中的 AppID 与 AppSecret |
| `JWT_SECRET` | 签发访问令牌用的密钥，**务必改为长随机串** |
| `JWT_EXPIRES_IN` | JWT 有效期，默认 `7d` |
| `DATABASE_PATH` | SQLite 文件路径，默认 `./data/app.db` |
| `ALLOWED_ORIGINS` | 可选，逗号分隔的 CORS 来源 |
| `DEV_SKIP_WECHAT` | 仅开发：设为 `1` 时跳过微信接口（**切勿在生产开启**） |

## API 一览

基础路径前缀：`/api/v1`。业务 JSON 一般为 `{ "status": "ok" | "error", "data"?: ..., "message"?: ... }`。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 服务健康检查 |
| `POST` | `/api/v1/auth/wechat` | body: `{ "code" }`，返回 `{ token, userId }` |
| `GET` | `/api/v1/me` | Bearer，当前用户信息 |
| `PUT` | `/api/v1/me/profile` | Bearer，body: `{ "nickname" }`（周榜展示名） |
| `GET` / `PUT` | `/api/v1/me/settings` | Bearer，月薪、每日工时等 |
| `GET` | `/api/v1/me/records` | Bearer，查询参数 `limit`、`offset` |
| `POST` | `/api/v1/me/records` | Bearer，body: `{ "records": [...] }`，单条可带 `id` 作幂等键 |
| `DELETE` | `/api/v1/me/records` | Bearer，清空当前用户记录 |
| `GET` | `/api/v1/leaderboard/week` | 可选 Bearer；查询参数 `limit`、`includeSelf` |

`POST /me/records` 会按服务端**当前已保存的设置**校验 `earnedMoney`，建议先 **PUT 设置** 再同步记录。

## 常见问题

- **端口被占用（EADDRINUSE）**：更换 `PORT`，或结束占用该端口的进程后再启动。
- **小程序真机请求**：需 **HTTPS** 域名，并在微信公众平台配置 **request 合法域名**；开发者工具可勾选「不校验合法域名」做本地联调。

## 仓库

远程示例：<https://github.com/Charliiiiii/pay_for_shit_backend>（若你 fork 或改名，以实际仓库为准）。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（`tsx watch`） |
| `npm run build` | 编译到 `dist/` |
| `npm start` | 运行编译产物 |
| `npm run typecheck` | 仅类型检查 |
