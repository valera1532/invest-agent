import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { asyncHandler } from "@/lib/async-handler";
import { requireAuth } from "@/middleware/require-auth";
import {
  getAccountMarginController,
  getAccountTariffController,
  getAccountsController,
  buyShareController,
  getDashboardOverviewController,
  getFxController,
  getPortfolioController,
  getSharesController,
  getSharesDebugController,
  searchTradingSharesController,
} from "@/controllers/market.controller";
import { getEnvController } from "@/controllers/meta.controller";
import {
  getInvestorSettingsController,
  updateInvestorSettingsController,
} from "@/controllers/settings.controller";
import {
  approveAiDecisionController,
  createAiPreviewJobController,
  executeAiDecisionController,
  getAiPreviewJobController,
  listAiDecisionsController,
  previewAiDecisionController,
  rejectAiDecisionController,
  runDailyAiReviewController,
} from "@/controllers/ai.controller";

export const marketRouter: ExpressRouter = Router();

marketRouter.use(requireAuth);

marketRouter.get("/shares", asyncHandler(getSharesController));
marketRouter.get("/shares/debug", asyncHandler(getSharesDebugController));
marketRouter.get("/trading/shares", asyncHandler(searchTradingSharesController));
marketRouter.post("/trading/buy", asyncHandler(buyShareController));
marketRouter.get("/dashboard/overview", asyncHandler(getDashboardOverviewController));
marketRouter.get("/portfolio", asyncHandler(getPortfolioController));
marketRouter.get("/accounts", asyncHandler(getAccountsController));
marketRouter.get("/settings", asyncHandler(getInvestorSettingsController));
marketRouter.put("/settings", asyncHandler(updateInvestorSettingsController));
marketRouter.get("/ai/decisions", asyncHandler(listAiDecisionsController));
marketRouter.post("/ai/decisions/preview", asyncHandler(previewAiDecisionController));
marketRouter.post("/ai/preview-jobs", asyncHandler(createAiPreviewJobController));
marketRouter.get("/ai/preview-jobs/:id", asyncHandler(getAiPreviewJobController));
marketRouter.post("/ai/decisions/:id/approve", asyncHandler(approveAiDecisionController));
marketRouter.post("/ai/decisions/:id/reject", asyncHandler(rejectAiDecisionController));
marketRouter.post("/ai/decisions/:id/execute", asyncHandler(executeAiDecisionController));
marketRouter.post("/ai/reviews/run-daily", asyncHandler(runDailyAiReviewController));
marketRouter.get("/accounts/:id/margin", asyncHandler(getAccountMarginController));
marketRouter.get("/accounts/:id/tariff", asyncHandler(getAccountTariffController));
marketRouter.get("/env", getEnvController);
marketRouter.get("/fx", asyncHandler(getFxController));
