import type { Request, Response } from "express";
import { accountParamsSchema, portfolioQuerySchema, sharesQuerySchema } from "@/schemas/market.schemas";
import { getMarginAttributes, getUserTariff, listAccounts } from "@/services/accounts.service";
import { getFxRates } from "@/integrations/cbr/fx.client";
import { getPortfolio } from "@/services/portfolio.service";
import { getSharesWithLastPrices } from "@/services/shares.service";

export async function getSharesController(request: Request, response: Response) {
  const { limit = 50 } = sharesQuerySchema.parse(request.query);
  const shares = await getSharesWithLastPrices(limit);
  response.json(shares);
}

export async function getSharesDebugController(request: Request, response: Response) {
  const { limit = 20 } = sharesQuerySchema.parse(request.query);
  const shares = await getSharesWithLastPrices(limit);
  response.json({
    count: shares.length,
    sample: shares[0] ?? null,
    ts: new Date().toISOString(),
  });
}

export async function getPortfolioController(request: Request, response: Response) {
  const { accountId } = portfolioQuerySchema.parse(request.query);
  const portfolio = await getPortfolio(accountId);
  response.json(portfolio);
}

export async function getAccountsController(_request: Request, response: Response) {
  const accounts = await listAccounts();
  response.json(accounts);
}

export async function getAccountMarginController(request: Request, response: Response) {
  const { id } = accountParamsSchema.parse(request.params);
  const margin = await getMarginAttributes(id);
  response.json(margin);
}

export async function getAccountTariffController(_request: Request, response: Response) {
  const tariff = await getUserTariff();
  response.json(tariff);
}

export async function getFxController(_request: Request, response: Response) {
  const payload = await getFxRates();
  response.json(payload);
}
