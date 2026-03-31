import { apiClient } from "@/shared/api/http";

export type MarketHighlight = {
  ticker: string;
  name: string;
  instrumentId: string;
  currency?: string;
  price?: number;
  lastPriceTime?: string;
};

type BackendShare = {
  ticker?: string;
  name?: string;
  figi?: string;
  instrumentUid?: string;
  lastPrice?: number;
  lastPriceTime?: string;
  currency?: string;
};

export async function getMarketHighlights() {
  const response = await apiClient.get<BackendShare[]>("/api/shares", {
    params: { limit: 50 },
  });

  return response.data.map((share, index) => ({
    instrumentId: share.instrumentUid ?? share.figi ?? `share-${index + 1}`,
    ticker: share.ticker ?? `SHARE-${index + 1}`,
    name: share.name ?? "Без названия",
    currency: share.currency,
    price: share.lastPrice,
    lastPriceTime: share.lastPriceTime,
  })) satisfies MarketHighlight[];
}
