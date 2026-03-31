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

export async function searchSharesForTrading(token: string, query: string, limit = 20): Promise<ShareSearchRow[]> {
  const cacheKey = `${token}:${query.toLowerCase()}:${limit}`;
  const cachedResult = shareSearchCache.get(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  const tinkoffApi = createTinkoffApi(token);
  const response = await tinkoffApi.instruments.findInstrument({
    query,
    instrumentKind: InstrumentType.INSTRUMENT_TYPE_SHARE,
    apiTradeAvailableFlag: true,
  });

  const instruments = response.instruments.slice(0, limit);
  const priceResponse = await tinkoffApi.marketdata.getLastPrices({
    instrumentId: instruments.map((instrument) => instrument.uid),
    figi: [],
    lastPriceType: 0,
  });

  const priceByUid = new Map(
    (priceResponse.lastPrices || []).map((price) => [String(price.instrumentUid), price]),
  );

  const result = instruments.map((instrument) => {
    const price = priceByUid.get(instrument.uid);
    const shareRow = {
      instrumentId: instrument.uid,
      ticker: instrument.ticker,
      figi: instrument.figi,
      name: instrument.name,
      lot: instrument.lot,
    };

    const lastPrice = price?.price ? moneyValueToNumber(price.price) : undefined;
    const lastPriceTime = timestampToIso(price?.time);

    return buildShareSearchRow({
      ...shareRow,
      ...(lastPrice != null ? { lastPrice } : {}),
      ...(lastPriceTime ? { lastPriceTime } : {}),
    });
  });

  shareSearchCache.set(cacheKey, result, SHARE_SEARCH_CACHE_TTL_MS);
  return result;
}

export async function buyShare(token: string, params: {
  accountId: string;
  instrumentId: string;
  quantity: number;
}): Promise<BuyOrderResultDto> {
  const tinkoffApi = createTinkoffApi(token);
  const response = await tinkoffApi.orders.postOrder({
    accountId: params.accountId,
    instrumentId: params.instrumentId,
    quantity: params.quantity,
    direction: OrderDirection.ORDER_DIRECTION_BUY,
    orderType: OrderType.ORDER_TYPE_MARKET,
    orderId: randomUUID(),
    timeInForce: TimeInForceType.TIME_IN_FORCE_DAY,
    priceType: PriceType.PRICE_TYPE_UNSPECIFIED,
  });

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

  return orderResult;
}
