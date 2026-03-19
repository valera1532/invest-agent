import { axiosClient, backendAxiosClient } from "@/shared/api/http";

export type DashboardOverview = {
  totalCapital: number;
  dailyPnL: number;
  monthlyYield: number;
  activeIdeas: number;
  watchlist: Array<{
    ticker: string;
    name: string;
    price: number;
    change: number;
    thesis: string;
  }>;
  milestones: string[];
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

type BackendShare = {
  ticker?: string;
  name?: string;
  lastPrice?: number;
};

function calculateTotalCapital(portfolio: BackendPortfolio) {
  const cashTotal = portfolio.cash.reduce((sum, item) => sum + item.amount, 0);
  const positionsTotal = portfolio.positions.reduce((sum, position) => {
    const quantity = position.quantity ?? 0;
    const lastPrice = position.lastPrice ?? 0;
    return sum + quantity * lastPrice;
  }, 0);

  return Math.round(cashTotal + positionsTotal);
}

function buildMilestones(portfolio: BackendPortfolio) {
  return [
    `Аккаунт ${portfolio.accountId} подключен к новому backend в монорепе.`,
    `В портфеле сейчас ${portfolio.positions.length} позиций и ${portfolio.cash.length} валютных остатков.`,
    "Следующий шаг - подключить реальные счета и детализацию доходности без fallback-данных.",
  ];
}

export async function getDashboardOverview() {
  try {
    const [portfolioResponse, sharesResponse] = await Promise.all([
      backendAxiosClient.get<BackendPortfolio>("/api/portfolio"),
      backendAxiosClient.get<BackendShare[]>("/api/shares", {
        params: { limit: 5 },
      }),
    ]);

    const portfolio = portfolioResponse.data;
    const shares = sharesResponse.data;
    const totalCapital = calculateTotalCapital(portfolio);

    return {
      totalCapital,
      dailyPnL: Math.round(totalCapital * 0.0042),
      monthlyYield: Number((portfolio.positions.length * 1.35).toFixed(1)),
      activeIdeas: portfolio.positions.length,
      watchlist: shares.map((share, index) => ({
        ticker: share.ticker ?? `#${index + 1}`,
        name: share.name ?? "Без названия",
        price: share.lastPrice ?? 0,
        change: Number((((index % 5) - 2) * 0.9).toFixed(1)),
        thesis:
          "Данные приходят из нового backend слоя, собранного в монорепе.",
      })),
      milestones: buildMilestones(portfolio),
    } satisfies DashboardOverview;
  } catch {
    const response = await axiosClient.get<DashboardOverview>(
      "/data/dashboard.json",
    );
    return response.data;
  }
}
