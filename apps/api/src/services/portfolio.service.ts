import { LastPriceType } from "tinkoff-invest-api/cjs/generated/marketdata";
import { ensureAccountId, tinkoffApi } from "@/integrations/tinkoff/tinkoff.client";
import { moneyValueToNumber, quotationToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import { fetchInstrumentMetaByUids } from "@/services/shares.service";
import type { CashRow, PortfolioDto, PositionRow } from "@/types/invest";

const ALLOWED_INSTRUMENT_TYPES = new Set<any>(["share", "etf", 2, 4]);

type PositionDraft = {
  figi?: string | undefined;
  instrumentUid?: string | undefined;
  ticker?: string | undefined;
  name?: string | undefined;
  currency?: string | undefined;
  quantity?: number | undefined;
  lastPrice?: number | undefined;
  lastPriceTime?: string | undefined;
};

function compactPosition(row: PositionDraft) {
  return {
    ...(row.figi ? { figi: row.figi } : {}),
    ...(row.instrumentUid ? { instrumentUid: row.instrumentUid } : {}),
    ...(row.ticker ? { ticker: row.ticker } : {}),
    ...(row.name ? { name: row.name } : {}),
    ...(row.currency ? { currency: row.currency } : {}),
    ...(row.quantity != null ? { quantity: row.quantity } : {}),
    ...(row.lastPrice != null ? { lastPrice: row.lastPrice } : {}),
    ...(row.lastPriceTime ? { lastPriceTime: row.lastPriceTime } : {}),
  } satisfies PositionRow;
}

export async function getPortfolio(accountId?: string): Promise<PortfolioDto> {
  const resolvedAccountId = await ensureAccountId(accountId);

  const [positionsResponse, portfolioResponse] = await Promise.all([
    tinkoffApi.operations.getPositions({ accountId: resolvedAccountId }),
    tinkoffApi.operations.getPortfolio({ accountId: resolvedAccountId }),
  ]);

  const cash = (positionsResponse.money || []).reduce((accumulator: CashRow[], item: any) => {
    const amount = moneyValueToNumber(item);
    if (amount != null) {
      accumulator.push({
        currency: String(item.currency || ""),
        amount,
      });
    }

    return accumulator;
  }, []);

  const rawPositions = (portfolioResponse.positions || []) as any[];
  const uids = rawPositions.map((position) => position.instrumentUid || position.uid).filter(Boolean) as string[];

  const [instrumentMeta, lastPricesResponse] = await Promise.all([
    fetchInstrumentMetaByUids(uids),
    tinkoffApi.marketdata.getLastPrices({
      instrumentId: uids,
      figi: [],
      lastPriceType: LastPriceType.LAST_PRICE_UNSPECIFIED,
    }),
  ]);

  const lastPriceByUid = new Map<string, any>(
    (lastPricesResponse.lastPrices || []).map((lastPrice: any) => [lastPrice.instrumentUid, lastPrice]),
  );

  const positions = rawPositions
    .map((position): PositionRow => {
      const uid = position.instrumentUid || position.uid;
      const meta = instrumentMeta.get(uid) || {};
      const lastPrice = lastPriceByUid.get(uid);
      const quantity = quotationToNumber(position.quantity);
      const currency = meta.currency || (position.averagePositionPrice?.currency as string | undefined) || undefined;

      return compactPosition({
        figi: position.figi,
        instrumentUid: uid,
        ticker: meta.ticker,
        name: meta.name,
        currency,
        quantity,
        lastPrice: quotationToNumber(lastPrice?.price),
        lastPriceTime: timestampToIso(lastPrice?.time),
      });
    })
    .filter((position) => {
      const meta = instrumentMeta.get(position.instrumentUid || "");
      if (meta?.instrumentType == null) {
        return true;
      }

      const normalizedType =
        typeof meta.instrumentType === "string" ? meta.instrumentType.toLowerCase() : meta.instrumentType;
      return ALLOWED_INSTRUMENT_TYPES.has(normalizedType);
    });

  return {
    accountId: resolvedAccountId,
    cash,
    positions,
  };
}
