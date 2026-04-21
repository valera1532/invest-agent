import { CandleInterval } from "tinkoff-invest-api/cjs/generated/marketdata";
import { OperationType } from "tinkoff-invest-api/cjs/generated/operations";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import { moneyValueToNumber, quotationToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import { listAccounts } from "@/services/accounts.service";
import { fetchInstrumentMetaByUids } from "@/services/shares.service";

type PeriodKey = "week" | "month" | "year";

type RecentTradeRow = {
  id: string;
  action: "buy" | "sell";
  ticker: string;
  name: string;
  quantity: number;
  price?: number;
  total?: number;
  currency?: string;
  accountName?: string;
  date?: string;
};

type PeriodMetric = {
  period: PeriodKey;
  change: number;
  relativeChange: number;
  tradesCount: number;
};

export type DashboardOverviewDto = {
  totalValue: number;
  investedValue: number;
  cashValue: number;
  accountsCount: number;
  currentYieldPct: number | null;
  dailyYield: number | null;
  dailyYieldPct: number | null;
  tradesCount30d: number;
  periods: PeriodMetric[];
  tradeHistory: {
    period: PeriodKey;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    items: RecentTradeRow[];
  };
};

type DashboardOverviewOptions = {
  historyPeriod: PeriodKey;
  page: number;
  pageSize: number;
};

type CurrentHolding = {
  instrumentUid: string;
  quantity: number;
  currentPrice: number;
};

type OperationRecord = {
  id: string;
  accountId: string;
  accountName?: string;
  instrumentUid?: string;
  operationType: number;
  quantity: number;
  payment: number;
  price?: number;
  currency?: string;
  date: Date;
};

function subtractDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function periodStart(period: PeriodKey) {
  switch (period) {
    case "week":
      return subtractDays(7);
    case "month":
      return subtractDays(30);
    case "year":
      return subtractDays(365);
  }
}

function isTradeOperation(operationType: number) {
  return operationType === OperationType.OPERATION_TYPE_BUY || operationType === OperationType.OPERATION_TYPE_SELL;
}

function isExternalCashFlow(operationType: number) {
  return new Set<number>([
    OperationType.OPERATION_TYPE_INPUT,
    OperationType.OPERATION_TYPE_OUTPUT,
    OperationType.OPERATION_TYPE_INPUT_ACQUIRING,
    OperationType.OPERATION_TYPE_OUTPUT_ACQUIRING,
    OperationType.OPERATION_TYPE_INPUT_SWIFT,
    OperationType.OPERATION_TYPE_OUTPUT_SWIFT,
  ]).has(operationType);
}

function mapTradeAction(operationType: number): "buy" | "sell" {
  return operationType === OperationType.OPERATION_TYPE_BUY ? "buy" : "sell";
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

async function getStartPrices(
  token: string,
  instrumentIds: string[],
  from: Date,
  instrumentTypes: Map<string, string | undefined>,
  currentHoldings: Map<string, CurrentHolding>,
) {
  const tinkoffApi = createTinkoffApi(token);
  const uniqueIds = [...new Set(instrumentIds)];
  const results = await Promise.all(
    uniqueIds.map(async (instrumentId) => {
      const instrumentType = instrumentTypes.get(instrumentId)?.toLowerCase();
      if (instrumentType === "bond") {
        return [instrumentId, currentHoldings.get(instrumentId)?.currentPrice] as const;
      }

      try {
        const candles = await tinkoffApi.marketdata.getCandles({
          instrumentId,
          figi: instrumentId,
          from,
          to: new Date(),
          interval: CandleInterval.CANDLE_INTERVAL_DAY,
        });
        const first = candles.candles?.[0];
        const close = quotationToNumber(first?.close);
        return [instrumentId, close] as const;
      } catch {
        return [instrumentId, undefined] as const;
      }
    }),
  );

  return new Map(results);
}

function buildPeriodMetric(params: {
  period: PeriodKey;
  currentCash: number;
  currentHoldings: Map<string, CurrentHolding>;
  operations: OperationRecord[];
  startPrices: Map<string, number | undefined>;
}) {
  const { period, currentCash, currentHoldings, operations, startPrices } = params;
  const tradeOperations = operations.filter((operation) => isTradeOperation(operation.operationType));
  const internalCashDelta = operations
    .filter((operation) => !isExternalCashFlow(operation.operationType))
    .reduce((sum, operation) => sum + operation.payment, 0);
  const startCash = currentCash - internalCashDelta;
  const startQuantities = new Map<string, number>();

  for (const [instrumentUid, holding] of currentHoldings.entries()) {
    startQuantities.set(instrumentUid, holding.quantity);
  }

  for (const operation of tradeOperations) {
    if (!operation.instrumentUid) {
      continue;
    }

    const current = startQuantities.get(operation.instrumentUid) ?? 0;
    const next =
      operation.operationType === OperationType.OPERATION_TYPE_BUY
        ? current - operation.quantity
        : current + operation.quantity;
    startQuantities.set(operation.instrumentUid, next);
  }

  let startInvested = 0;
  for (const [instrumentUid, quantity] of startQuantities.entries()) {
    if (quantity <= 0) {
      continue;
    }

    const startPrice = startPrices.get(instrumentUid);
    if (startPrice == null) {
      const currentHolding = currentHoldings.get(instrumentUid);
      if (currentHolding) {
        startInvested += quantity * currentHolding.currentPrice;
      }
      continue;
    }

    startInvested += quantity * startPrice;
  }

  const currentInvested = [...currentHoldings.values()].reduce(
    (sum, holding) => sum + holding.quantity * holding.currentPrice,
    0,
  );

  const startTotal = startCash + startInvested;
  const endTotal = currentCash + currentInvested;
  const change = endTotal - startTotal;
  const relativeChange = startTotal > 0 ? (change / startTotal) * 100 : 0;

  return {
    period,
    change: roundMoney(change),
    relativeChange: Number(relativeChange.toFixed(2)),
    tradesCount: tradeOperations.length,
  } satisfies PeriodMetric;
}

export async function getDashboardOverview(token: string, options: DashboardOverviewOptions): Promise<DashboardOverviewDto> {
  const tinkoffApi = createTinkoffApi(token);
  const accounts = await listAccounts(token);
  const accountPortfolios = await Promise.all(
    accounts.map(async (account) => {
      const [portfolio, operations] = await Promise.all([
        tinkoffApi.operations.getPortfolio({ accountId: account.id }),
        tinkoffApi.operations.getOperations({
          accountId: account.id,
          from: periodStart("year"),
          to: new Date(),
        }),
      ]);

      return { account, portfolio, operations: operations.operations || [] };
    }),
  );

  const currentCash = accountPortfolios.reduce(
    (sum, item) => sum + (moneyValueToNumber(item.portfolio.totalAmountCurrencies) ?? 0),
    0,
  );
  const currentInvested = accountPortfolios.reduce(
    (sum, item) => sum + (moneyValueToNumber(item.portfolio.totalAmountPortfolio) ?? 0) - (moneyValueToNumber(item.portfolio.totalAmountCurrencies) ?? 0),
    0,
  );
  const totalValue = currentCash + currentInvested;
  const weightedYieldPct = accountPortfolios.reduce(
    (sum, item) => {
      const total = moneyValueToNumber(item.portfolio.totalAmountPortfolio) ?? 0;
      const yieldPct = quotationToNumber(item.portfolio.expectedYield) ?? 0;
      return sum + total * yieldPct;
    },
    0,
  );
  const currentYieldPct = totalValue > 0 ? Number((weightedYieldPct / totalValue).toFixed(2)) : null;
  const dailyYield = accountPortfolios.reduce(
    (sum, item) => sum + (moneyValueToNumber(item.portfolio.dailyYield) ?? 0),
    0,
  );
  const dailyYieldPct = totalValue > 0 ? Number(((dailyYield / (totalValue - dailyYield)) * 100).toFixed(2)) : null;

  const currentHoldings = new Map<string, CurrentHolding>();
  for (const item of accountPortfolios) {
    for (const position of item.portfolio.positions || []) {
      if (!position.instrumentUid || position.instrumentType === "currency") {
        continue;
      }

      const quantity = quotationToNumber(position.quantity);
      const currentPrice = moneyValueToNumber(position.currentPrice);
      if (quantity == null || currentPrice == null) {
        continue;
      }

      currentHoldings.set(position.instrumentUid, {
        instrumentUid: position.instrumentUid,
        quantity,
        currentPrice,
      });
    }
  }

  const operations = accountPortfolios.flatMap(({ account, operations }) =>
    operations
      .map((operation) => {
        const payment = moneyValueToNumber(operation.payment) ?? 0;
        const record: OperationRecord = {
          id: operation.id,
          accountId: account.id,
          operationType: operation.operationType,
          quantity: operation.quantity,
          payment,
          date: operation.date ?? new Date(),
        };

        if (account.name) {
          record.accountName = account.name;
        }
        if (operation.instrumentUid) {
          record.instrumentUid = operation.instrumentUid;
        }
        const price = moneyValueToNumber(operation.price);
        if (price != null) {
          record.price = price;
        }
        if (operation.currency) {
          record.currency = operation.currency;
        }

        return record;
      })
      .filter((operation) => operation.date),
  );

  const yearTradeInstrumentIds = operations
    .filter((operation) => isTradeOperation(operation.operationType) && operation.instrumentUid)
    .map((operation) => String(operation.instrumentUid));

  const instrumentMeta = await fetchInstrumentMetaByUids(token, yearTradeInstrumentIds);
  const instrumentTypes = new Map(
    [...currentHoldings.keys(), ...yearTradeInstrumentIds].map((instrumentId) => [
      instrumentId,
      instrumentMeta.get(instrumentId)?.instrumentType,
    ]),
  );
  const periods: PeriodMetric[] = [];

  for (const period of ["week", "month", "year"] as const) {
    const from = periodStart(period);
    const periodOperations = operations.filter((operation) => operation.date >= from);
    const relevantInstrumentIds = periodOperations
      .filter((operation) => isTradeOperation(operation.operationType) && operation.instrumentUid)
      .map((operation) => String(operation.instrumentUid));
    const startPrices = await getStartPrices(
      token,
      [...currentHoldings.keys(), ...relevantInstrumentIds],
      from,
      instrumentTypes,
      currentHoldings,
    );

    periods.push(
      buildPeriodMetric({
        period,
        currentCash,
        currentHoldings,
        operations: periodOperations,
        startPrices,
      }),
    );
  }

  const filteredTrades = operations
    .filter((operation) => isTradeOperation(operation.operationType) && operation.instrumentUid)
    .filter((operation) => operation.date >= periodStart(options.historyPeriod))
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .map((operation) => {
      const trade: RecentTradeRow = {
        id: operation.id,
        action: mapTradeAction(operation.operationType),
        ticker: instrumentMeta.get(operation.instrumentUid ?? "")?.ticker ?? "UNKNOWN",
        name: instrumentMeta.get(operation.instrumentUid ?? "")?.name ?? "Без названия",
        quantity: operation.quantity,
      };

      if (operation.price != null) {
        trade.price = operation.price;
      }
      trade.total = Math.abs(operation.payment);
      if (operation.currency) {
        trade.currency = operation.currency;
      }
      if (operation.accountName) {
        trade.accountName = operation.accountName;
      }
      const date = timestampToIso(operation.date);
      if (date) {
        trade.date = date;
      }

      return trade;
    });
  const totalTrades = filteredTrades.length;
  const totalPages = Math.max(1, Math.ceil(totalTrades / options.pageSize));
  const page = Math.min(options.page, totalPages);
  const pageStart = (page - 1) * options.pageSize;
  const pagedTrades = filteredTrades.slice(pageStart, pageStart + options.pageSize);

  const tradesCount30d = operations.filter(
    (operation) => isTradeOperation(operation.operationType) && operation.date >= periodStart("month"),
  ).length;

  return {
    totalValue: roundMoney(totalValue),
    investedValue: roundMoney(currentInvested),
    cashValue: roundMoney(currentCash),
    accountsCount: accounts.length,
    currentYieldPct: currentYieldPct != null ? Number(currentYieldPct.toFixed(2)) : null,
    dailyYield: dailyYield ? roundMoney(dailyYield) : null,
    dailyYieldPct,
    tradesCount30d,
    periods,
    tradeHistory: {
      period: options.historyPeriod,
      page,
      pageSize: options.pageSize,
      total: totalTrades,
      totalPages,
      items: pagedTrades,
    },
  };
}
