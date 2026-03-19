import { LastPriceType } from "tinkoff-invest-api/cjs/generated/marketdata";
import { InstrumentIdType } from "tinkoff-invest-api/cjs/generated/instruments";
import { tinkoffApi } from "@/integrations/tinkoff/tinkoff.client";
import { quotationToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import type { ShareRow } from "@/types/invest";

type ShareDraft = {
  ticker: string;
  name: string;
  figi?: string | undefined;
  instrumentUid?: string | undefined;
  currency?: string | undefined;
  lastPrice?: number | undefined;
  lastPriceTime?: string | undefined;
};

function compactShare(row: ShareDraft): ShareRow {
  return {
    ticker: row.ticker,
    name: row.name,
    ...(row.figi ? { figi: row.figi } : {}),
    ...(row.instrumentUid ? { instrumentUid: row.instrumentUid } : {}),
    ...(row.currency ? { currency: row.currency } : {}),
    ...(row.lastPrice != null ? { lastPrice: row.lastPrice } : {}),
    ...(row.lastPriceTime ? { lastPriceTime: row.lastPriceTime } : {}),
  };
}

export async function getSharesWithLastPrices(limit = 50): Promise<ShareRow[]> {
  const { instruments } = await tinkoffApi.instruments.shares({
    instrumentStatus: 1,
  });

  const selected = instruments.slice(0, Math.min(limit, 200));
  const ids = selected.map((share: any) => share.uid || share.instrumentUid || share.figi).filter(Boolean) as string[];

  if (ids.length === 0) {
    return [];
  }

  const { lastPrices } = await tinkoffApi.marketdata.getLastPrices({
    instrumentId: ids,
    figi: [],
    lastPriceType: LastPriceType.LAST_PRICE_UNSPECIFIED,
  });

  const lastByUid = new Map<string, any>(
    (lastPrices || []).map((lastPrice: any) => [String(lastPrice.instrumentUid || ""), lastPrice]),
  );

  return selected.map((share: any) => {
    const uid = share.uid || share.instrumentUid;
    const lastPrice = uid ? lastByUid.get(uid) : undefined;

    return compactShare({
      ticker: share.ticker,
      figi: share.figi,
      instrumentUid: uid,
      name: share.name,
      currency: share.currency,
      lastPrice: quotationToNumber(lastPrice?.price),
      lastPriceTime: timestampToIso(lastPrice?.time),
    });
  });
}

export async function fetchInstrumentMetaByUids(uids: string[]) {
  const uniqueUids = Array.from(new Set(uids.filter(Boolean)));
  const result = new Map<
    string,
    {
      ticker?: string;
      name?: string;
      currency?: string;
      instrumentType?: string;
    }
  >();

  await Promise.all(
    uniqueUids.map((uid) =>
      tinkoffApi.instruments
        .getInstrumentBy({
          idType: InstrumentIdType.INSTRUMENT_ID_TYPE_UID,
          id: uid,
        })
        .then((response: any) => {
          const instrument = response?.instrument;
          if (instrument?.uid) {
            result.set(instrument.uid, {
              ticker: instrument.ticker,
              name: instrument.name,
              currency: instrument.currency,
              instrumentType: instrument.instrumentType,
            });
          }
        })
        .catch(() => undefined),
    ),
  );

  return result;
}
