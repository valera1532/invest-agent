import { apiClient } from "@/shared/api/http";

export type DashboardOverview = {
  totalCapital: number;
  investedCapital: number;
  cashBalance: number;
  accountsCount: number;
  accounts: Array<{
    id: string;
    name?: string;
    type?: string;
    status?: string;
    openedDate?: string;
  }>;
  positions: Array<{
    ticker: string;
    name: string;
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

type BackendAccount = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  openedDate?: string;
};

type BackendPortfolio = {
  accountId: string;
  accounts: BackendAccount[];
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

export async function getDashboardOverview() {
  const [accountsResponse, portfolioResponse] = await Promise.all([
    apiClient.get<BackendAccount[]>("/api/accounts"),
    apiClient.get<BackendPortfolio>("/api/portfolio"),
  ]);

  const accounts = accountsResponse.data;
  const portfolio = portfolioResponse.data;
  const investedCapital = portfolio.positions.reduce(
    (sum, position) => sum + (position.currentValue ?? 0),
    0,
  );
  const cashBalance = portfolio.cash.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return {
    totalCapital: Math.round(investedCapital + cashBalance),
    investedCapital: Math.round(investedCapital),
    cashBalance: Math.round(cashBalance),
    accountsCount: accounts.length,
    accounts,
    positions: portfolio.positions.map((position, index) => ({
      ticker: position.ticker ?? `POS-${index + 1}`,
      name: position.name ?? "Без названия",
      quantity: position.quantity ?? 0,
      lastPrice: position.lastPrice,
      currentValue: position.currentValue,
      currency: position.currency,
      instrumentType: position.instrumentType,
      accountName: position.accountName,
    })),
    cash: portfolio.cash,
  } satisfies DashboardOverview;
}
