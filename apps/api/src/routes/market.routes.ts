import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { asyncHandler } from "@/lib/async-handler";
import { requireAuth } from "@/middleware/require-auth";
import {
  getAccountMarginController,
  getAccountTariffController,
  getAccountsController,
  buyShareController,
  getFxController,
  getPortfolioController,
  getSharesController,
  getSharesDebugController,
  searchTradingSharesController,
} from "@/controllers/market.controller";
import { getEnvController } from "@/controllers/meta.controller";

export const marketRouter: ExpressRouter = Router();

marketRouter.use(requireAuth);

marketRouter.get("/shares", asyncHandler(getSharesController));
marketRouter.get("/shares/debug", asyncHandler(getSharesDebugController));
marketRouter.get("/trading/shares", asyncHandler(searchTradingSharesController));
marketRouter.post("/trading/buy", asyncHandler(buyShareController));
marketRouter.get("/portfolio", asyncHandler(getPortfolioController));
marketRouter.get("/accounts", asyncHandler(getAccountsController));
marketRouter.get("/accounts/:id/margin", asyncHandler(getAccountMarginController));
marketRouter.get("/accounts/:id/tariff", asyncHandler(getAccountTariffController));
marketRouter.get("/env", getEnvController);
marketRouter.get("/fx", asyncHandler(getFxController));
