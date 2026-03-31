import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { asyncHandler } from "@/lib/async-handler";
import {
  connectTbankTokenController,
  disconnectTbankTokenController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/require-auth";

export const authRouter: ExpressRouter = Router();

authRouter.post("/register", asyncHandler(registerController));
authRouter.post("/login", asyncHandler(loginController));
authRouter.post("/refresh", asyncHandler(refreshController));
authRouter.post("/logout", asyncHandler(logoutController));
authRouter.get("/me", requireAuth, asyncHandler(meController));
authRouter.post("/tbank/connect", requireAuth, asyncHandler(connectTbankTokenController));
authRouter.delete("/tbank/disconnect", requireAuth, asyncHandler(disconnectTbankTokenController));
