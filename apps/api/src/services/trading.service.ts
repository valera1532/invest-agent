import { randomUUID } from "node:crypto";
import { InstrumentType, PriceType } from "tinkoff-invest-api/cjs/generated/common";
import {
  OrderDirection,
  OrderExecutionReportStatus,
  OrderType,
  TimeInForceType,
} from "tinkoff-invest-api/cjs/generated/orders";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import { timestampToIso, moneyValueToNumber } from "@/integrations/tinkoff/tinkoff.utils";
import { createTtlCache } from "@/lib/cache";
import { HttpError } from "@/lib/http-error";
import type { BuyOrderResultDto, ShareSearchRow } from "@/types/invest";

const shareSearchCache = createTtlCache<ShareSearchRow[]>();
const SHARE_SEARCH_CACHE_TTL_MS = 60_000;

const executionStatusLabels: Record<number, string> = {
  [OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_NEW]: "Новая заявка",
  [OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_FILL]: "Исполнена",
  [OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_REJECTED]: "Отклонена",
  [OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_CANCELLED]: "Отменена",
  [OrderExecutionReportStatus.EXECUTION_REPORT_STATUS_PARTIALLYFILL]: "Частично исполнена",
};

type MarketOrderParams = {
  accountId: string;
  instrumentId: string;
  quantity: number;
  direction: OrderDirection.ORDER_DIRECTION_BUY | OrderDirection.ORDER_DIRECTION_SELL;
};

type MarketOrderResult = BuyOrderResultDto & {
  rawResponse: unknown;
};

function mapTradingError(error: unknown): never {
  if (!(error instanceof Error)) {
    throw error;
  }

  const grpcLikeError = error as Error & { code?: number; details?: string };
  const details = grpcLikeError.details || error.message;
  const normalizedDetails = details.toLowerCase();

  if (normalizedDetails.includes("not enough assets for a margin trade")) {
    throw new HttpError(400, "На выбранном счете недостаточно средств или доступного лимита для покупки этой заявки", {
      brokerMessage: details,
    });
  }

  if (
    normalizedDetails.includes("trading is unavailable") ||
    normalizedDetails.includes("market order is not available") ||
    normalizedDetails.includes("instrument is not available for trading")
  ) {
    throw new HttpError(400, "Сейчас по этому инструменту нельзя выставить заявку: торги закрыты или инструмент недоступен", {
      brokerMessage: details,
    });
  }

  if (grpcLikeError.code === 3) {
    throw new HttpError(400, details, {
      brokerMessage: details,
    });
  }

  throw error;
}

function buildShareSearchRow(row: {
  instrumentId: string;
  ticker: string;
  figi?: string;
  name: string;
  currency?: string;
  lot: number;
  lastPrice?: number;
  lastPriceTime?: string;
}): ShareSearchRow {
  return {
    instrumentId: row.instrumentId,
    ticker: row.ticker,
    name: row.name,
    lot: row.lot,
    ...(row.figi ? { figi: row.figi } : {}),
    ...(row.currency ? { currency: row.currency } : {}),
    ...(row.lastPrice != null ? { lastPrice: row.lastPrice } : {}),
    ...(row.lastPriceTime ? { lastPriceTime: row.lastPriceTime } : {}),
  };
}

function buildPriceByUidMap(lastPrices: Array<{ instrumentUid?: string | undefined }> = []) {
  return new Map(lastPrices.map((price) => [String(price.instrumentUid), price]));
}

function mapInstrumentToTradingShare(
  instrument: {
    uid: string;
    ticker: string;
    figi?: string;
    name: string;
    currency?: string;
    lot: number;
  },
  priceByUid: Map<string, any>,
) {
  const price = priceByUid.get(instrument.uid);
  const lastPrice = price?.price ? moneyValueToNumber(price.price) : undefined;
  const lastPriceTime = timestampToIso(price?.time);

  return buildShareSearchRow({
    instrumentId: instrument.uid,
    ticker: instrument.ticker,
    name: instrument.name,
    lot: instrument.lot,
    ...(instrument.figi ? { figi: instrument.figi } : {}),
    ...(instrument.currency ? { currency: instrument.currency } : {}),
    ...(lastPrice != null ? { lastPrice } : {}),
    ...(lastPriceTime ? { lastPriceTime } : {}),
  });
}

async function listTradeableShares(token: string, limit = 20): Promise<ShareSearchRow[]> {
  const tinkoffApi = createTinkoffApi(token);
  const response = await tinkoffApi.instruments.shares({});
  const instruments = response.instruments
    .filter(
      (instrument) =>
        instrument.apiTradeAvailableFlag &&
        instrument.buyAvailableFlag &&
        !instrument.forQualInvestorFlag,
    )
    .sort((left, right) => left.ticker.localeCompare(right.ticker))
    .slice(0, limit);

  if (!instruments.length) {
    return [];
  }

  const priceResponse = await tinkoffApi.marketdata.getLastPrices({
    instrumentId: instruments.map((instrument) => instrument.uid),
    figi: [],
    lastPriceType: 0,
  });

  const priceByUid = buildPriceByUidMap(priceResponse.lastPrices || []);
  return instruments.map((instrument) => mapInstrumentToTradingShare(instrument, priceByUid));
}

export async function searchSharesForTrading(token: string, query: string, limit = 20): Promise<ShareSearchRow[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `${token}:${normalizedQuery}:${limit}`;
  const cachedResult = shareSearchCache.get(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  if (!normalizedQuery) {
    const result = await listTradeableShares(token, limit);
    shareSearchCache.set(cacheKey, result, SHARE_SEARCH_CACHE_TTL_MS);
    return result;
  }

  const tinkoffApi = createTinkoffApi(token);
  const response = await tinkoffApi.instruments.findInstrument({
    query: normalizedQuery,
    instrumentKind: InstrumentType.INSTRUMENT_TYPE_SHARE,
    apiTradeAvailableFlag: true,
  });

  const instruments = response.instruments.slice(0, limit);
  if (!instruments.length) {
    shareSearchCache.set(cacheKey, [], SHARE_SEARCH_CACHE_TTL_MS);
    return [];
  }

  const priceResponse = await tinkoffApi.marketdata.getLastPrices({
    instrumentId: instruments.map((instrument) => instrument.uid),
    figi: [],
    lastPriceType: 0,
  });

  const priceByUid = buildPriceByUidMap(priceResponse.lastPrices || []);
  const result = instruments.map((instrument) => mapInstrumentToTradingShare(instrument, priceByUid));

  shareSearchCache.set(cacheKey, result, SHARE_SEARCH_CACHE_TTL_MS);
  return result;
}

export async function placeMarketOrder(token: string, params: MarketOrderParams): Promise<MarketOrderResult> {
  const tinkoffApi = createTinkoffApi(token);
  let response;

  try {
    response = await tinkoffApi.orders.postOrder({
      accountId: params.accountId,
      instrumentId: params.instrumentId,
      quantity: params.quantity,
      direction: params.direction,
      orderType: OrderType.ORDER_TYPE_MARKET,
      orderId: randomUUID(),
      timeInForce: TimeInForceType.TIME_IN_FORCE_DAY,
      priceType: PriceType.PRICE_TYPE_UNSPECIFIED,
    });
  } catch (error) {
    mapTradingError(error);
  }

  const orderResult: BuyOrderResultDto = {
    orderId: response.orderId,
    executionStatus:
      executionStatusLabels[response.executionReportStatus] ?? response.executionReportStatus.toString(),
    lotsRequested: response.lotsRequested,
    lotsExecuted: response.lotsExecuted,
    instrumentUid: response.instrumentUid,
    message: response.message,
  };

  if (response.totalOrderAmount) {
    const totalOrderAmount = moneyValueToNumber(response.totalOrderAmount);
    if (totalOrderAmount != null) {
      orderResult.totalOrderAmount = totalOrderAmount;
    }
  }

  return {
    ...orderResult,
    rawResponse: response,
  };
}

export async function buyShare(token: string, params: {
  accountId: string;
  instrumentId: string;
  quantity: number;
}): Promise<BuyOrderResultDto> {
  const result = await placeMarketOrder(token, {
    ...params,
    direction: OrderDirection.ORDER_DIRECTION_BUY,
  });

  const { rawResponse, ...orderResult } = result;
  void rawResponse;
  return orderResult;
}

export async function sellShare(token: string, params: {
  accountId: string;
  instrumentId: string;
  quantity: number;
}): Promise<BuyOrderResultDto> {
  const result = await placeMarketOrder(token, {
    ...params,
    direction: OrderDirection.ORDER_DIRECTION_SELL,
  });

  const { rawResponse, ...orderResult } = result;
  void rawResponse;
  return orderResult;
}
