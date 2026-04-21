import { LastPriceType } from "tinkoff-invest-api/cjs/generated/marketdata";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import { moneyValueToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import { createTtlCache } from "@/lib/cache";
import type { AiAssetClass, AiUniverseInstrument } from "@/types/ai";
import type { InvestorSettingsInput } from "@/schemas/settings.schemas";

const aiUniverseCache = createTtlCache<AiUniverseInstrument[]>();
const AI_UNIVERSE_CACHE_TTL_MS = 5 * 60 * 1000;

type InstrumentLike = {
  uid: string;
  ticker?: string;
  name?: string;
  currency?: string;
  lot?: number;
  apiTradeAvailableFlag?: boolean;
  buyAvailableFlag?: boolean;
  sellAvailableFlag?: boolean;
  forQualInvestorFlag?: boolean;
};

function mapAssetClassLabel(assetClass: AiAssetClass) {
  return assetClass;
}

function normalizeInstrument(assetClass: AiAssetClass, instrument: InstrumentLike): AiUniverseInstrument | null {
  if (!instrument.uid || !instrument.ticker || !instrument.name || !instrument.lot) {
    return null;
  }

  if (!instrument.apiTradeAvailableFlag || !instrument.buyAvailableFlag || instrument.forQualInvestorFlag) {
    return null;
  }

  return {
    instrumentId: instrument.uid,
    ticker: instrument.ticker,
    name: instrument.name,
    assetClass: mapAssetClassLabel(assetClass),
    ...(instrument.currency ? { currency: instrument.currency } : {}),
    lot: instrument.lot,
  };
}

async function listAssetClass(
  token: string,
  assetClass: AiAssetClass,
  limit: number,
): Promise<AiUniverseInstrument[]> {
  const tinkoffApi = createTinkoffApi(token);
  const responseMap = {
    share: () => tinkoffApi.instruments.shares({}),
    bond: () => tinkoffApi.instruments.bonds({}),
    etf: () => tinkoffApi.instruments.etfs({}),
    currency: () => tinkoffApi.instruments.currencies({}),
  } as const;

  const response = (await responseMap[assetClass]()) as { instruments?: InstrumentLike[] };
  return (response.instruments || [])
    .map((instrument) => normalizeInstrument(assetClass, instrument))
    .filter((instrument): instrument is AiUniverseInstrument => instrument !== null)
    .sort((left, right) => left.ticker.localeCompare(right.ticker))
    .slice(0, limit);
}

export async function buildMultiAssetUniverse(token: string) {
  const cacheKey = token;
  const cachedUniverse = aiUniverseCache.get(cacheKey);
  if (cachedUniverse) {
    return cachedUniverse;
  }

  const [shares, bonds, etfs, currencies] = await Promise.all([
    listAssetClass(token, "share", 60),
    listAssetClass(token, "bond", 35),
    listAssetClass(token, "etf", 25),
    listAssetClass(token, "currency", 12),
  ]);

  const instruments = [...shares, ...bonds, ...etfs, ...currencies];
  if (!instruments.length) {
    return [] satisfies AiUniverseInstrument[];
  }

  const tinkoffApi = createTinkoffApi(token);
  const pricesResponse = await tinkoffApi.marketdata.getLastPrices({
    instrumentId: instruments.map((instrument) => instrument.instrumentId),
    figi: [],
    lastPriceType: LastPriceType.LAST_PRICE_UNSPECIFIED,
  });

  const priceByUid = new Map(
    (pricesResponse.lastPrices || []).map((price: any) => [String(price.instrumentUid), price]),
  );

  const universe = instruments.map((instrument) => {
    const price = priceByUid.get(instrument.instrumentId);
    const lastPrice = price?.price ? moneyValueToNumber(price.price) : undefined;
    const lastPriceTime = timestampToIso(price?.time);

    return {
      ...instrument,
      ...(lastPrice != null ? { lastPrice } : {}),
      ...(lastPriceTime ? { lastPriceTime } : {}),
    } satisfies AiUniverseInstrument;
  });

  aiUniverseCache.set(cacheKey, universe, AI_UNIVERSE_CACHE_TTL_MS);
  return universe;
}

export function selectUniverseForRiskProfile(
  universe: AiUniverseInstrument[],
  riskProfile: InvestorSettingsInput["riskProfile"],
) {
  const sorted = [...universe].sort((left, right) => left.ticker.localeCompare(right.ticker));
  const byAssetClass = {
    share: sorted.filter((instrument) => instrument.assetClass === "share"),
    bond: sorted.filter((instrument) => instrument.assetClass === "bond"),
    etf: sorted.filter((instrument) => instrument.assetClass === "etf"),
    currency: sorted.filter((instrument) => instrument.assetClass === "currency"),
  };

  const limits = {
    conservative: { share: 20, bond: 16, etf: 10, currency: 6 },
    balanced: { share: 24, bond: 12, etf: 12, currency: 6 },
    growth: { share: 28, bond: 8, etf: 12, currency: 4 },
    aggressive: { share: 30, bond: 6, etf: 10, currency: 2 },
  }[riskProfile];

  return [
    ...byAssetClass.share.slice(0, limits.share),
    ...byAssetClass.bond.slice(0, limits.bond),
    ...byAssetClass.etf.slice(0, limits.etf),
    ...byAssetClass.currency.slice(0, limits.currency),
  ];
}
