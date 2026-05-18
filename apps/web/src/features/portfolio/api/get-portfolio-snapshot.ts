import { apiClient } from "@/shared/api/http";

export type PortfolioTotals = {
  totalPortfolio: number;
  shares: number;
  bonds: number;
  etf: number;
  currencies: number;
  futures: number;
  options: number;
  structuredProducts: number;
  other: number;
};

export type PortfolioSnapshot = {
  accountId: string;
  accounts: Array<{
    id: string;
    name?: string;
  }>;
  totalValue: number;
  stocksValue: number;
  cashValue: number;
  totals: PortfolioTotals;
  positions: Array<{
    ticker: string;
    issuer: string;
    quantity: number;
    lastPrice?: number;
    currentValue?: number;
    currency?: string;
    instrumentType?: string;
    sector?: string;
    accountName?: string;
  }>;
  cash: Array<{
    currency: string;
    amount: number;
    accountName?: string;
  }>;
};

type GetPortfolioSnapshotParams = {
  accountId?: string;
};

type BackendPortfolio = {
  accountId: string;
  accounts: Array<{ id: string; name?: string }>;
  totals?: Partial<PortfolioTotals>;
  cash: Array<{ currency: string; amount: number; accountName?: string }>;
  positions: Array<{
    ticker?: string;
    name?: string;
    quantity?: number;
    lastPrice?: number;
    currentValue?: number;
    currency?: string;
    instrumentType?: string;
    sector?: string;
    accountName?: string;
  }>;
};

const emptyTotals: PortfolioTotals = {
  totalPortfolio: 0,
  shares: 0,
  bonds: 0,
  etf: 0,
  currencies: 0,
  futures: 0,
  options: 0,
  structuredProducts: 0,
  other: 0,
};

export async function getPortfolioSnapshot(
  params: GetPortfolioSnapshotParams = {},
) {
  const response = await apiClient.get<BackendPortfolio>("/api/portfolio", {
    params: params.accountId ? { accountId: params.accountId } : undefined,
  });
  const portfolio = response.data;
  const stocksValue = portfolio.positions.reduce(
    (sum, position) => sum + (position.currentValue ?? 0),
    0,
  );
  const cashValue = portfolio.cash.reduce((sum, item) => sum + item.amount, 0);
  const totals = { ...emptyTotals, ...portfolio.totals };
  const totalValue = totals.totalPortfolio || stocksValue + cashValue;

  return {
    accountId: portfolio.accountId,
    accounts: portfolio.accounts,
    totalValue: Math.round(totalValue),
    stocksValue: Math.round(stocksValue),
    cashValue: Math.round(cashValue),
    totals,
    positions: portfolio.positions.map((position, index) => ({
      ticker: position.ticker ?? `POS-${index + 1}`,
      issuer: position.name ?? "Без названия",
      quantity: position.quantity ?? 0,
      lastPrice: position.lastPrice,
      currentValue: position.currentValue,
      currency: position.currency,
      instrumentType: position.instrumentType,
      sector: position.sector,
      accountName: position.accountName,
    })),
    cash: portfolio.cash,
  } satisfies PortfolioSnapshot;
}
