import "@/lib/path-alias-register";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { Express } from "express";
import { authRouter } from "@/routes/auth.routes";
import { env } from "@/config/env";
import { getHealthController, getRootController } from "@/controllers/meta.controller";
import { errorMiddleware } from "@/lib/error-middleware";
import { marketRouter } from "@/routes/market.routes";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  app.get("/", getRootController);
  app.get("/health", getHealthController);
  app.use("/api/auth", authRouter);
  app.use("/api", marketRouter);

  app.use(errorMiddleware);

  return app;
}
