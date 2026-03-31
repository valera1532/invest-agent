import type { NextFunction, Request, Response } from "express";
import { ACCESS_COOKIE_NAME } from "@/lib/auth-cookies";
import { HttpError } from "@/lib/http-error";
import { verifyAccessToken } from "@/lib/jwt";

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const token = request.cookies?.[ACCESS_COOKIE_NAME];

  if (!token) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    const payload = verifyAccessToken(token);
    request.authUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch {
    return next(new HttpError(401, "Authentication required"));
  }
}
