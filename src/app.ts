import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import type { Env } from "./config/env.js";
import { createRouter, type RouteDeps } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";

export function createApp(env: Env, deps: RouteDeps) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin:
        env.allowedOriginsList.length > 0
          ? env.allowedOriginsList
          : (origin, cb) => {
              if (!origin) return cb(null, true);
              return cb(null, true);
            },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "2mb" }));

  app.use(createRouter(deps));
  app.use(errorHandler);

  return app;
}
