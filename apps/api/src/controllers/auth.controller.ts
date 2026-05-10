import type { Request, Response } from "express";
import { clearAuthCookies, REFRESH_COOKIE_NAME, setAuthCookies } from "@/lib/auth-cookies";
import { signAccessToken } from "@/lib/jwt";
import { connectTbankSchema, loginSchema, registerSchema } from "@/schemas/auth.schemas";
import {
  createRefreshSession,
  getCurrentUser,
  loginUser,
  registerUser,
  revokeRefreshSession,
  rotateRefreshSession,
} from "@/services/auth.service";
import { removeUserTbankToken, saveUserTbankToken } from "@/services/tbank-connection.service";
import { HttpError } from "@/lib/http-error";

function getRequestMeta(request: Request) {
  return {
    userAgent: request.headers["user-agent"],
    ipAddress: request.ip,
  };
}

export async function registerController(request: Request, response: Response) {
  const input = registerSchema.parse(request.body);
  const user = await registerUser(input);
  const refreshToken = await createRefreshSession(user.id, getRequestMeta(request).userAgent, getRequestMeta(request).ipAddress);
  const accessToken = signAccessToken(user);

  setAuthCookies(response, accessToken, refreshToken);
  response.status(201).json({
    ...user,
    hasTbankToken: false,
    tbankTokenMasked: null,
    hasCompletedInvestorQuiz: false,
  });
}

export async function loginController(request: Request, response: Response) {
  const input = loginSchema.parse(request.body);
  const user = await loginUser(input);
  const refreshToken = await createRefreshSession(user.id, getRequestMeta(request).userAgent, getRequestMeta(request).ipAddress);
  const accessToken = signAccessToken(user);

  setAuthCookies(response, accessToken, refreshToken);
  const profile = await getCurrentUser(user.id);
  response.json(profile);
}

export async function refreshController(request: Request, response: Response) {
  const refreshToken = request.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw new HttpError(401, "Сессия истекла, войди заново");
  }

  const nextSession = await rotateRefreshSession(refreshToken, getRequestMeta(request).userAgent, getRequestMeta(request).ipAddress);
  const accessToken = signAccessToken(nextSession.user);

  setAuthCookies(response, accessToken, nextSession.refreshToken);
  const profile = await getCurrentUser(nextSession.user.id);
  response.json(profile);
}

export async function logoutController(request: Request, response: Response) {
  await revokeRefreshSession(request.cookies?.[REFRESH_COOKIE_NAME]);
  clearAuthCookies(response);
  response.status(204).send();
}

export async function meController(request: Request, response: Response) {
  if (!request.authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const profile = await getCurrentUser(request.authUser.id);
  response.json(profile);
}

export async function connectTbankTokenController(request: Request, response: Response) {
  if (!request.authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const input = connectTbankSchema.parse(request.body);
  const connection = await saveUserTbankToken(request.authUser.id, input.token);

  response.json({
    ok: true,
    tokenMasked: connection.tokenMasked,
    lastCheckedAt: connection.lastCheckedAt,
  });
}

export async function disconnectTbankTokenController(request: Request, response: Response) {
  if (!request.authUser) {
    throw new HttpError(401, "Authentication required");
  }

  await removeUserTbankToken(request.authUser.id);
  response.status(204).send();
}
