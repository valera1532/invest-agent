import type { Request, Response } from "express";
import { env } from "@/config/env";

export function getHealthController(_request: Request, response: Response) {
  response.json({ ok: true, ts: Date.now() });
}

export function getEnvController(_request: Request, response: Response) {
  response.json({
    sandbox: env.tinkoffSandbox,
    ts: Date.now(),
    version: "v2",
  });
}

export function getRootController(_request: Request, response: Response) {
  response.json({
    ok: true,
    message: "Invest Agent API is running",
    endpoints: [
      "/health",
      "/api/shares",
      "/api/shares/debug",
      "/api/portfolio",
      "/api/accounts",
      "/api/accounts/:id/margin",
      "/api/accounts/:id/tariff",
      "/api/env",
      "/api/fx",
    ],
  });
}
