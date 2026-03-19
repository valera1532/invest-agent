import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { asyncHandler } from "@/lib/async-handler";
import {
  getAccountMarginController,
  getAccountTariffController,
  getAccountsController,
  getFxController,
  getPortfolioController,
  getSharesController,
  getSharesDebugController,
} from "@/controllers/market.controller";
import { getEnvController } from "@/controllers/meta.controller";

export const marketRouter: ExpressRouter = Router();

marketRouter.get("/shares", asyncHandler(getSharesController));
marketRouter.get("/shares/debug", asyncHandler(getSharesDebugController));
marketRouter.get("/portfolio", asyncHandler(getPortfolioController));
marketRouter.get("/accounts", asyncHandler(getAccountsController));
marketRouter.get("/accounts/:id/margin", asyncHandler(getAccountMarginController));
marketRouter.get("/accounts/:id/tariff", asyncHandler(getAccountTariffController));
marketRouter.get("/env", getEnvController);
marketRouter.get("/fx", asyncHandler(getFxController));
