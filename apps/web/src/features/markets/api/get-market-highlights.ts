import { backendAxiosClient, kyClient } from "@/shared/api/http";

type BackendShare = {
  ticker?: string;
  name?: string;
  price?: number;
  lastPrice?: number;
  currency?: string;
};

export type MarketHighlight = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  weekChange: number;
  dividendStory: string;
  thesis: string;
};

const sectorKeywords: Array<[string, string]> = [
  ["bank", "Финансы"],
  ["group", "Технологии"],
  ["oil", "Энергетика"],
  ["gas", "Энергетика"],
  ["steel", "Металлургия"],
  ["retail", "Потребительский сектор"],
  ["tech", "Технологии"],
];

function detectSector(name: string) {
  const normalized = name.toLowerCase();
  const match = sectorKeywords.find(([keyword]) =>
    normalized.includes(keyword),
  );
  return match?.[1] ?? "Российский рынок";
}

function buildThesis(ticker: string, sector: string) {
  return `${ticker} остается в фокусе как представитель сектора ${sector.toLowerCase()}.`;
}

function mapBackendShare(
  share: BackendShare,
  index: number,
): MarketHighlight | null {
  if (!share.ticker || !share.name) {
    return null;
  }

  const sector = detectSector(share.name);
  const price = Number(share.lastPrice ?? share.price ?? 0);

  return {
    ticker: share.ticker,
    name: share.name,
    sector,
    price,
    weekChange: Number(((index % 5) - 1.5).toFixed(1)),
    dividendStory:
      share.currency === "RUB"
        ? "рублевый актив с локальной ликвидностью"
        : "нужна проверка валютной экспозиции",
    thesis: buildThesis(share.ticker, sector),
  };
}

export async function getMarketHighlights() {
  try {
    const response = await backendAxiosClient.get<BackendShare[]>(
      "/api/shares",
      {
        params: { limit: 12 },
      },
    );

    const mapped = response.data
      .map((share, index) => mapBackendShare(share, index))
      .filter((share): share is MarketHighlight => share !== null);

    if (mapped.length > 0) {
      return mapped;
    }
  } catch {
    // Fallback to local demo data when backend is unavailable.
  }

  return kyClient.get("/data/market.json").json<MarketHighlight[]>();
}
