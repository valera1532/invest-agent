import type { Request, Response } from "express";
import {
  accountParamsSchema,
  buyShareSchema,
  dashboardOverviewQuerySchema,
  portfolioQuerySchema,
  sharesQuerySchema,
  shareSearchQuerySchema,
} from "@/schemas/market.schemas";
import { getMarginAttributes, getUserTariff, listAccounts } from "@/services/accounts.service";
import { getDashboardOverview } from "@/services/dashboard.service";
import { getFxRates } from "@/integrations/cbr/fx.client";
import { getPortfolio } from "@/services/portfolio.service";
import { getSharesWithLastPrices } from "@/services/shares.service";
import { HttpError } from "@/lib/http-error";
import { getUserTbankToken } from "@/services/tbank-connection.service";
import { buyShare, searchSharesForTrading } from "@/services/trading.service";

async function resolveUserToken(request: Request) {
  const userId = request.authUser?.id;

  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  return getUserTbankToken(userId);
}

export async function getSharesController(request: Request, response: Response) {
  const { limit = 50 } = sharesQuerySchema.parse(request.query);
  const token = await resolveUserToken(request);
  const shares = await getSharesWithLastPrices(token, limit);
  response.json(shares);
}

export async function getSharesDebugController(request: Request, response: Response) {
  const { limit = 20 } = sharesQuerySchema.parse(request.query);
  const token = await resolveUserToken(request);
  const shares = await getSharesWithLastPrices(token, limit);
  response.json({
    count: shares.length,
    sample: shares[0] ?? null,
    ts: new Date().toISOString(),
  });
}

export async function searchTradingSharesController(request: Request, response: Response) {
  const { query, limit = 20 } = shareSearchQuerySchema.parse(request.query);
  const token = await resolveUserToken(request);
  const shares = await searchSharesForTrading(token, query, limit);
  response.json(shares);
}

export async function buyShareController(request: Request, response: Response) {
  const payload = buyShareSchema.parse(request.body);
  const token = await resolveUserToken(request);
  const result = await buyShare(token, payload);
  response.status(201).json(result);
}

export async function getPortfolioController(request: Request, response: Response) {
  const { accountId } = portfolioQuerySchema.parse(request.query);
  const token = await resolveUserToken(request);
  const portfolio = await getPortfolio(token, accountId);
  response.json(portfolio);
}

export async function getAccountsController(request: Request, response: Response) {
  const token = await resolveUserToken(request);
  const accounts = await listAccounts(token);
  response.json(accounts);
}

export async function getDashboardOverviewController(request: Request, response: Response) {
  const token = await resolveUserToken(request);
  const query = dashboardOverviewQuerySchema.parse(request.query);
  const overview = await getDashboardOverview(token, query);
  response.json(overview);
}

export async function getAccountMarginController(request: Request, response: Response) {
  const { id } = accountParamsSchema.parse(request.params);
  const token = await resolveUserToken(request);
  const margin = await getMarginAttributes(token, id);
  response.json(margin);
}

export async function getAccountTariffController(request: Request, response: Response) {
  const token = await resolveUserToken(request);
  const tariff = await getUserTariff(token);
  response.json(tariff);
}

export async function getFxController(_request: Request, response: Response) {
  const payload = await getFxRates();
  response.json(payload);
}
