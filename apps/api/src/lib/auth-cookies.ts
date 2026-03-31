import type { Response } from "express";
import { env } from "@/config/env";

export const ACCESS_COOKIE_NAME = "ia_access";
export const REFRESH_COOKIE_NAME = "ia_refresh";

const baseCookieConfig = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProduction,
  path: "/",
};

export function setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
  response.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...baseCookieConfig,
    maxAge: 15 * 60 * 1000,
  });

  response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieConfig,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(response: Response) {
  response.clearCookie(ACCESS_COOKIE_NAME, baseCookieConfig);
  response.clearCookie(REFRESH_COOKIE_NAME, baseCookieConfig);
}
