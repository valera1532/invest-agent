import { createHash } from "node:crypto";
import { LastPriceType } from "tinkoff-invest-api/cjs/generated/marketdata";
import { InstrumentIdType } from "tinkoff-invest-api/cjs/generated/instruments";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import { quotationToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import { createTtlCache } from "@/lib/cache";
import { listAccounts } from "@/services/accounts.service";
import type { ShareRow } from "@/types/invest";

const sharesCache = createTtlCache<ShareRow[]>();
const instrumentMetaCache = createTtlCache<{
  ticker?: string;
  name?: string;
  currency?: string;
  instrumentType?: string;
}>();
const SHARES_CACHE_TTL_MS = 60_000;
const INSTRUMENT_META_CACHE_TTL_MS = 15 * 60_000;
const SHARE_LIKE_TYPES = new Set(["share", "etf"]);

function createTokenScope(token: string) {
  return createHash("sha1").update(token).digest("hex");
}

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

export async function getSharesWithLastPrices(token: string, limit = 50): Promise<ShareRow[]> {
  const tokenScope = createTokenScope(token);
  const cacheKey = `${tokenScope}:shares:${Math.min(limit, 200)}`;
  const cachedShares = sharesCache.get(cacheKey);

  if (cachedShares) {
    return cachedShares;
  }

  const tinkoffApi = createTinkoffApi(token);
  const accounts = await listAccounts(token);
  const positionsResponses = await Promise.all(
    accounts.map((account) => tinkoffApi.operations.getPositions({ accountId: account.id })),
  );
  const securities = positionsResponses.flatMap((response) => (response.securities || []) as any[]);
  const securityUids = securities
    .map((security) => security.instrumentUid || security.uid)
    .filter(Boolean) as string[];
  const instrumentMeta = await fetchInstrumentMetaByUids(token, securityUids);
  const selected = securities
    .map((security) => {
      const uid = security.instrumentUid || security.uid;
      if (!uid) {
        return null;
      }

      const meta = instrumentMeta.get(uid);
      const instrumentType = typeof meta?.instrumentType === "string" ? meta.instrumentType.toLowerCase() : undefined;
      if (!instrumentType || !SHARE_LIKE_TYPES.has(instrumentType)) {
        return null;
      }

      return {
        uid,
        figi: security.figi,
        ticker: meta?.ticker || uid.slice(0, 8).toUpperCase(),
        name: meta?.name || "Без названия",
        currency: meta?.currency,
      };
    })
    .filter((share): share is NonNullable<typeof share> => share !== null)
    .slice(0, Math.min(limit, 200));
  const ids = selected.map((share) => share.uid);

  if (ids.length === 0) {
    sharesCache.set(cacheKey, [], SHARES_CACHE_TTL_MS);
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

  const result = selected.map((share) => {
    const lastPrice = lastByUid.get(share.uid);

    return compactShare({
      ticker: share.ticker,
      figi: share.figi,
      instrumentUid: share.uid,
      name: share.name,
      currency: share.currency,
      lastPrice: quotationToNumber(lastPrice?.price),
      lastPriceTime: timestampToIso(lastPrice?.time),
    });
  });

  sharesCache.set(cacheKey, result, SHARES_CACHE_TTL_MS);
  return result;
}

export async function fetchInstrumentMetaByUids(token: string, uids: string[]) {
  const tinkoffApi = createTinkoffApi(token);
  const tokenScope = createTokenScope(token);
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

  const missingUids: string[] = [];

  uniqueUids.forEach((uid) => {
    const cachedMeta = instrumentMetaCache.get(`${tokenScope}:${uid}`);
    if (cachedMeta) {
      result.set(uid, cachedMeta);
      return;
    }

    missingUids.push(uid);
  });

  await Promise.all(
    missingUids.map((uid) =>
      tinkoffApi.instruments
        .getInstrumentBy({
          idType: InstrumentIdType.INSTRUMENT_ID_TYPE_UID,
          id: uid,
        })
        .then((response: any) => {
          const instrument = response?.instrument;
          if (instrument?.uid) {
            const meta = {
              ticker: instrument.ticker,
              name: instrument.name,
              currency: instrument.currency,
              instrumentType: instrument.instrumentType,
            };
            result.set(instrument.uid, meta);
            instrumentMetaCache.set(`${tokenScope}:${instrument.uid}`, meta, INSTRUMENT_META_CACHE_TTL_MS);
          }
        })
        .catch(() => undefined),
    ),
  );

  return result;
}
