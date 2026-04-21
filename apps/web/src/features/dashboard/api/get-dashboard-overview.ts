import { apiClient } from "@/shared/api/http";

export type DashboardOverview = {
  totalValue: number;
  investedValue: number;
  cashValue: number;
  accountsCount: number;
  currentYieldPct: number | null;
  dailyYield: number | null;
  dailyYieldPct: number | null;
  tradesCount30d: number;
  periods: Array<{
    period: "week" | "month" | "year";
    change: number;
    relativeChange: number;
    tradesCount: number;
  }>;
  tradeHistory: {
    period: "week" | "month" | "year";
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: Array<{
      id: string;
      action: "buy" | "sell";
      ticker: string;
      name: string;
      quantity: number;
      price?: number;
      total?: number;
      currency?: string;
      accountName?: string;
      date?: string;
    }>;
  };
};

export async function getDashboardOverview(params: {
  historyPeriod: "week" | "month" | "year";
  page: number;
  pageSize: number;
}) {
  const response = await apiClient.get<DashboardOverview>(
    "/api/dashboard/overview",
    {
      params,
    },
  );
  return response.data;
}
