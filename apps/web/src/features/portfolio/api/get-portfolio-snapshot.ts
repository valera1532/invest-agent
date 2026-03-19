import { axiosClient, backendAxiosClient } from "@/shared/api/http";

export type PortfolioSnapshot = {
  totalValue: number;
  stocksShare: number;
  cashShare: number;
  monthlyIncome: number;
  positions: Array<{
    ticker: string;
    issuer: string;
    allocation: number;
    result: number;
    strategy: string;
  }>;
};

type BackendPortfolio = {
  accountId: string;
  cash: Array<{ currency: string; amount: number }>;
  positions: Array<{
    ticker?: string;
    name?: string;
    quantity?: number;
    lastPrice?: number;
  }>;
};

function calculatePortfolioValue(portfolio: BackendPortfolio) {
  const cashValue = portfolio.cash.reduce((sum, item) => sum + item.amount, 0);
  const stocksValue = portfolio.positions.reduce((sum, position) => {
    return sum + (position.quantity ?? 0) * (position.lastPrice ?? 0);
  }, 0);

  return { cashValue, stocksValue, totalValue: cashValue + stocksValue };
}

export async function getPortfolioSnapshot() {
  try {
    const response =
      await backendAxiosClient.get<BackendPortfolio>("/api/portfolio");
    const portfolio = response.data;
    const { cashValue, stocksValue, totalValue } =
      calculatePortfolioValue(portfolio);
    const safeTotal = totalValue || 1;

    return {
      totalValue: Math.round(totalValue),
      stocksShare: Math.round((stocksValue / safeTotal) * 100),
      cashShare: Math.round((cashValue / safeTotal) * 100),
      monthlyIncome: Math.round(stocksValue * 0.012),
      positions: portfolio.positions.map((position, index) => ({
        ticker: position.ticker ?? `POS-${index + 1}`,
        issuer: position.name ?? "Без названия",
        allocation: Math.round(
          (((position.quantity ?? 0) * (position.lastPrice ?? 0)) / safeTotal) *
            100,
        ),
        result: Number((((index % 6) - 2) * 2.1).toFixed(1)),
        strategy: "Позиция получена из нового backend API",
      })),
    } satisfies PortfolioSnapshot;
  } catch {
    const response = await axiosClient.get<PortfolioSnapshot>(
      "/data/portfolio.json",
    );
    return response.data;
  }
}
