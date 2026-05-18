import { createHash } from "node:crypto";
import { LastPriceType } from "tinkoff-invest-api/cjs/generated/marketdata";
import {
  InstrumentIdType,
  type InstrumentRequest,
} from "tinkoff-invest-api/cjs/generated/instruments";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import {
  quotationToNumber,
  timestampToIso,
} from "@/integrations/tinkoff/tinkoff.utils";
import { createTtlCache } from "@/lib/cache";
import { listAccounts } from "@/services/accounts.service";
import type { ShareRow } from "@/types/invest";

const sharesCache = createTtlCache<ShareRow[]>();
type InstrumentMeta = {
  ticker?: string;
  name?: string;
  currency?: string;
  instrumentType?: string;
  assetUid?: string;
  sector?: string;
  sectorLookupCompleted?: boolean;
};

const instrumentMetaCache = createTtlCache<InstrumentMeta>();
const SHARES_CACHE_TTL_MS = 60_000;
const INSTRUMENT_META_CACHE_TTL_MS = 15 * 60_000;
const SHARE_LIKE_TYPES = new Set(["share", "etf"]);
const SHARE_SECTOR_FALLBACK_BY_TICKER = new Map<string, string>([
  ["AFLT", "Транспорт"],
  ["AFKS", "Холдинги"],
  ["AGRO", "Потребительский сектор"],
  ["ALRS", "Металлургия и добыча"],
  ["ASTR", "IT и интернет"],
  ["BANE", "Нефтегаз"],
  ["BANEP", "Нефтегаз"],
  ["BSPB", "Финансы"],
  ["CBOM", "Финансы"],
  ["CHMF", "Металлургия и добыча"],
  ["CIAN", "IT и интернет"],
  ["DIAS", "IT и интернет"],
  ["ETLN", "Недвижимость"],
  ["FEES", "Электроэнергетика"],
  ["FESH", "Транспорт"],
  ["FIVE", "Потребительский сектор"],
  ["FIXP", "Потребительский сектор"],
  ["FLOT", "Транспорт"],
  ["GAZP", "Нефтегаз"],
  ["GEMC", "Здравоохранение"],
  ["GMKN", "Металлургия и добыча"],
  ["HHRU", "IT и интернет"],
  ["HYDR", "Электроэнергетика"],
  ["IRAO", "Электроэнергетика"],
  ["KAZT", "Химия и удобрения"],
  ["KAZTP", "Химия и удобрения"],
  ["LENT", "Потребительский сектор"],
  ["LKOH", "Нефтегаз"],
  ["LSRG", "Недвижимость"],
  ["MAGN", "Металлургия и добыча"],
  ["MDMG", "Здравоохранение"],
  ["MGNT", "Потребительский сектор"],
  ["MOEX", "Финансы"],
  ["MSNG", "Электроэнергетика"],
  ["MTLR", "Металлургия и добыча"],
  ["MTLRP", "Металлургия и добыча"],
  ["MTSS", "Телеком"],
  ["MVID", "Потребительский сектор"],
  ["NKNCP", "Химия и удобрения"],
  ["NKNC", "Химия и удобрения"],
  ["NLMK", "Металлургия и добыча"],
  ["NMTP", "Транспорт"],
  ["NVTK", "Нефтегаз"],
  ["OGKB", "Электроэнергетика"],
  ["OZON", "IT и интернет"],
  ["PHOR", "Химия и удобрения"],
  ["PIKK", "Недвижимость"],
  ["PLZL", "Металлургия и добыча"],
  ["POSI", "IT и интернет"],
  ["RASP", "Металлургия и добыча"],
  ["ROSN", "Нефтегаз"],
  ["RTKM", "Телеком"],
  ["RTKMP", "Телеком"],
  ["RUAL", "Металлургия и добыча"],
  ["SBER", "Финансы"],
  ["SBERP", "Финансы"],
  ["SELG", "Металлургия и добыча"],
  ["SIBN", "Нефтегаз"],
  ["SMLT", "Недвижимость"],
  ["SNGS", "Нефтегаз"],
  ["SNGSP", "Нефтегаз"],
  ["SOFL", "IT и интернет"],
  ["T", "Финансы"],
  ["TATN", "Нефтегаз"],
  ["TATNP", "Нефтегаз"],
  ["TCSG", "Финансы"],
  ["TGKA", "Электроэнергетика"],
  ["TRNFP", "Нефтегаз"],
  ["UPRO", "Электроэнергетика"],
  ["VKCO", "IT и интернет"],
  ["VTBR", "Финансы"],
  ["YDEX", "IT и интернет"],
]);

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

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function inferShareSectorFromFallback(input: InstrumentMeta) {
  if (input.instrumentType?.toLowerCase() !== "share") {
    return undefined;
  }

  const tickerSector = input.ticker
    ? SHARE_SECTOR_FALLBACK_BY_TICKER.get(input.ticker.toUpperCase())
    : undefined;
  if (tickerSector) {
    return tickerSector;
  }

  const name = input.name?.toLowerCase() ?? "";
  if (
    /газпром|роснефт|лукойл|новатэк|татнефт|сургут|башнефт|транснефт|славнефт|нефть|газ/.test(
      name,
    )
  ) {
    return "Нефтегаз";
  }
  if (/сбер|втб|тинькофф|т-банк|банк|мосбирж|бирж|финанс/.test(name)) {
    return "Финансы";
  }
  if (
    /яндекс|yandex|vk|positive|ozon|softline|астра|headhunter|циан|diasoft|диасофт/.test(
      name,
    )
  ) {
    return "IT и интернет";
  }
  if (
    /норникель|северсталь|нлмк|ммк|русал|алрос|полюс|мечел|селигдар|металл|золото|алюмин/.test(
      name,
    )
  ) {
    return "Металлургия и добыча";
  }
  if (/магнит|x5|пятероч|лента|fix price|мвидео|агро|русагро/.test(name)) {
    return "Потребительский сектор";
  }
  if (/мтс|ростелеком|телеком/.test(name)) {
    return "Телеком";
  }
  if (/интер рао|русгидро|фск|мосэнерго|энерг/.test(name)) {
    return "Электроэнергетика";
  }
  if (/пик|самолет|лср|эталон|недвиж/.test(name)) {
    return "Недвижимость";
  }
  if (/аэрофлот|совкомфлот|нмтп|двмп|транспорт|флот/.test(name)) {
    return "Транспорт";
  }
  if (
    /фосагро|акрон|казаньоргсинтез|нижнекамскнефтехим|хими|удобр/.test(name)
  ) {
    return "Химия и удобрения";
  }

  return undefined;
}

function applyFallbackSectorToMeta(meta: InstrumentMeta): InstrumentMeta {
  const fallbackSector = meta.sector ?? inferShareSectorFromFallback(meta);

  return {
    ...meta,
    ...(fallbackSector ? { sector: fallbackSector } : {}),
  };
}

async function fetchAssetSectorByUid(
  tinkoffApi: ReturnType<typeof createTinkoffApi>,
  assetUid?: string,
) {
  if (!assetUid) {
    return undefined;
  }

  try {
    return normalizeOptionalText(
      (await tinkoffApi.instruments.getAssetBy({ id: assetUid })).asset?.brand
        ?.sector,
    );
  } catch {
    return undefined;
  }
}

async function fetchInstrumentSector(
  tinkoffApi: ReturnType<typeof createTinkoffApi>,
  uid: string,
  instrumentType?: string,
  assetUid?: string,
) {
  const assetSector = await fetchAssetSectorByUid(tinkoffApi, assetUid);
  if (assetSector) {
    return assetSector;
  }

  const request: InstrumentRequest = {
    idType: InstrumentIdType.INSTRUMENT_ID_TYPE_UID,
    id: uid,
  };

  try {
    switch (instrumentType?.toLowerCase()) {
      case "share":
        return normalizeOptionalText(
          (await tinkoffApi.instruments.shareBy(request)).instrument?.sector,
        );
      case "bond":
        return normalizeOptionalText(
          (await tinkoffApi.instruments.bondBy(request)).instrument?.sector,
        );
      case "etf":
        return normalizeOptionalText(
          (await tinkoffApi.instruments.etfBy(request)).instrument?.sector,
        );
      case "future":
      case "futures":
        return normalizeOptionalText(
          (await tinkoffApi.instruments.futureBy(request)).instrument?.sector,
        );
      case "option":
      case "options":
        return normalizeOptionalText(
          (await tinkoffApi.instruments.optionBy(request)).instrument?.sector,
        );
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

export async function getSharesWithLastPrices(
  token: string,
  limit = 50,
): Promise<ShareRow[]> {
  const tokenScope = createTokenScope(token);
  const cacheKey = `${tokenScope}:shares:${Math.min(limit, 200)}`;
  const cachedShares = sharesCache.get(cacheKey);

  if (cachedShares) {
    return cachedShares;
  }

  const tinkoffApi = createTinkoffApi(token);
  const accounts = await listAccounts(token);
  const positionsResponses = await Promise.all(
    accounts.map((account) =>
      tinkoffApi.operations.getPositions({ accountId: account.id }),
    ),
  );
  const securities = positionsResponses.flatMap(
    (response) => (response.securities || []) as any[],
  );
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
      const instrumentType =
        typeof meta?.instrumentType === "string"
          ? meta.instrumentType.toLowerCase()
          : undefined;
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
    (lastPrices || []).map((lastPrice: any) => [
      String(lastPrice.instrumentUid || ""),
      lastPrice,
    ]),
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
  const result = new Map<string, InstrumentMeta>();

  const missingUids: string[] = [];

  uniqueUids.forEach((uid) => {
    const cachedMeta = instrumentMetaCache.get(`${tokenScope}:${uid}`);
    if (cachedMeta?.sectorLookupCompleted) {
      const metaWithFallback = applyFallbackSectorToMeta(cachedMeta);
      result.set(uid, metaWithFallback);
      if (metaWithFallback.sector !== cachedMeta.sector) {
        instrumentMetaCache.set(
          `${tokenScope}:${uid}`,
          metaWithFallback,
          INSTRUMENT_META_CACHE_TTL_MS,
        );
      }
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
            const ticker = normalizeOptionalText(instrument.ticker);
            const name = normalizeOptionalText(instrument.name);
            const currency = normalizeOptionalText(instrument.currency);
            const assetUid = normalizeOptionalText(instrument.assetUid);
            const instrumentType = normalizeOptionalText(
              instrument.instrumentType,
            );
            const meta: InstrumentMeta = {
              ...(ticker ? { ticker } : {}),
              ...(name ? { name } : {}),
              ...(currency ? { currency } : {}),
              ...(assetUid ? { assetUid } : {}),
              ...(instrumentType ? { instrumentType } : {}),
            };
            return fetchInstrumentSector(
              tinkoffApi,
              instrument.uid,
              instrumentType,
              assetUid,
            ).then((sector) => {
              const metaWithSector = applyFallbackSectorToMeta({
                ...meta,
                ...(sector ? { sector } : {}),
                sectorLookupCompleted: true,
              });
              result.set(instrument.uid, metaWithSector);
              instrumentMetaCache.set(
                `${tokenScope}:${instrument.uid}`,
                metaWithSector,
                INSTRUMENT_META_CACHE_TTL_MS,
              );
            });
          }

          return undefined;
        })
        .catch(() => undefined),
    ),
  );

  return result;
}
