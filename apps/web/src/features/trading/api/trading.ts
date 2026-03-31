import { apiClient } from "@/shared/api/http";

export type BrokerageAccount = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
};

export type TradingShare = {
  instrumentId: string;
  ticker: string;
  figi?: string;
  name: string;
  currency?: string;
  lot: number;
  lastPrice?: number;
  lastPriceTime?: string;
};

export type BuyOrderResult = {
  orderId: string;
  executionStatus: string;
  lotsRequested: number;
  lotsExecuted: number;
  instrumentUid: string;
  message: string;
  totalOrderAmount?: number;
};

export async function getBrokerageAccounts() {
  const response = await apiClient.get<BrokerageAccount[]>("/api/accounts");
  return response.data;
}

export async function searchTradingShares(query: string, limit = 20) {
  const response = await apiClient.get<TradingShare[]>("/api/trading/shares", {
    params: { query, limit },
  });
  return response.data;
}

export async function createBuyOrder(payload: {
  accountId: string;
  instrumentId: string;
  quantity: number;
}) {
  const response = await apiClient.post<BuyOrderResult>(
    "/api/trading/buy",
    payload,
  );
  return response.data;
}
