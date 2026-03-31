import { apiClient } from "@/shared/api/http";

export type PortfolioSnapshot = {
  accountId: string;
  accounts: Array<{
    id: string;
    name?: string;
  }>;
  totalValue: number;
  stocksValue: number;
  cashValue: number;
  positions: Array<{
    ticker: string;
    issuer: string;
    quantity: number;
    lastPrice?: number;
    currentValue?: number;
    currency?: string;
    instrumentType?: string;
    accountName?: string;
  }>;
  cash: Array<{
    currency: string;
    amount: number;
    accountName?: string;
  }>;
};

type BackendPortfolio = {
  accountId: string;
  accounts: Array<{ id: string; name?: string }>;
  cash: Array<{ currency: string; amount: number; accountName?: string }>;
  positions: Array<{
    ticker?: string;
    name?: string;
    quantity?: number;
    lastPrice?: number;
    currentValue?: number;
    currency?: string;
    instrumentType?: string;
    accountName?: string;
  }>;
};

export async function getPortfolioSnapshot() {
  const response = await apiClient.get<BackendPortfolio>("/api/portfolio");
  const portfolio = response.data;
  const stocksValue = portfolio.positions.reduce(
    (sum, position) => sum + (position.currentValue ?? 0),
    0,
  );
  const cashValue = portfolio.cash.reduce((sum, item) => sum + item.amount, 0);

  return {
    accountId: portfolio.accountId,
    accounts: portfolio.accounts,
    totalValue: Math.round(stocksValue + cashValue),
    stocksValue: Math.round(stocksValue),
    cashValue: Math.round(cashValue),
    positions: portfolio.positions.map((position, index) => ({
      ticker: position.ticker ?? `POS-${index + 1}`,
      issuer: position.name ?? "Без названия",
      quantity: position.quantity ?? 0,
      lastPrice: position.lastPrice,
      currentValue: position.currentValue,
      currency: position.currency,
      instrumentType: position.instrumentType,
      accountName: position.accountName,
    })),
    cash: portfolio.cash,
  } satisfies PortfolioSnapshot;
}
