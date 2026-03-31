import type { Request, Response } from "express";
export function getHealthController(_request: Request, response: Response) {
  response.json({ ok: true, ts: Date.now() });
}

export function getEnvController(_request: Request, response: Response) {
  response.json({
    ts: Date.now(),
    version: "v3",
  });
}

export function getRootController(_request: Request, response: Response) {
  response.json({
    ok: true,
    message: "Invest Agent API is running",
    endpoints: [
      "/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/refresh",
      "/api/auth/logout",
      "/api/auth/me",
      "/api/auth/tbank/connect",
      "/api/shares",
      "/api/shares/debug",
      "/api/trading/shares",
      "/api/trading/buy",
      "/api/portfolio",
      "/api/accounts",
      "/api/accounts/:id/margin",
      "/api/accounts/:id/tariff",
      "/api/env",
      "/api/fx",
    ],
  });
}
