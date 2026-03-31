import type { NextFunction, Request, Response } from "express";
import { env } from "@/config/env";
import { HttpError } from "@/lib/http-error";

export function errorMiddleware(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  void _next;

  if (error instanceof Error && error.message.includes("UNAUTHENTICATED")) {
    response.status(401).json({
      error: "Tinkoff authentication failed",
      message: "T-Bank token is missing, expired, or invalid.",
      details: env.isProduction ? undefined : error.message,
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: error.message,
      details: env.isProduction ? undefined : error.details,
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({
    error: "Internal server error",
    message: env.isProduction ? undefined : message,
  });
}
