import { LastPriceType } from "tinkoff-invest-api/cjs/generated/marketdata";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import {
  moneyValueToNumber,
  quotationToNumber,
  timestampToIso,
} from "@/integrations/tinkoff/tinkoff.utils";
import { listAccounts } from "@/services/accounts.service";
import { fetchInstrumentMetaByUids } from "@/services/shares.service";
import type {
  CashRow,
  PortfolioDto,
  PortfolioTotalsDto,
  PositionRow,
} from "@/types/invest";

type PositionDraft = {
  figi?: string | undefined;
  instrumentUid?: string | undefined;
  ticker?: string | undefined;
  name?: string | undefined;
  currency?: string | undefined;
  quantity?: number | undefined;
  lastPrice?: number | undefined;
  lastPriceTime?: string | undefined;
  currentValue?: number | undefined;
  instrumentType?: string | undefined;
  sector?: string | undefined;
  accountId?: string | undefined;
  accountName?: string | undefined;
};

const zeroPortfolioTotals: PortfolioTotalsDto = {
  totalPortfolio: 0,
  shares: 0,
  bonds: 0,
  etf: 0,
  currencies: 0,
  futures: 0,
  options: 0,
  structuredProducts: 0,
  other: 0,
};

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function sumPortfolioAmount(
  accountPortfolios: Array<{ portfolioResponse: any }>,
  key: string,
) {
  return accountPortfolios.reduce(
    (sum, item) => sum + (moneyValueToNumber(item.portfolioResponse[key]) ?? 0),
    0,
  );
}

function buildPortfolioTotals(
  accountPortfolios: Array<{ portfolioResponse: any }>,
): PortfolioTotalsDto {
  const shares = sumPortfolioAmount(accountPortfolios, "totalAmountShares");
  const bonds = sumPortfolioAmount(accountPortfolios, "totalAmountBonds");
  const etf = sumPortfolioAmount(accountPortfolios, "totalAmountEtf");
  const currencies = sumPortfolioAmount(
    accountPortfolios,
    "totalAmountCurrencies",
  );
  const futures = sumPortfolioAmount(accountPortfolios, "totalAmountFutures");
  const options = sumPortfolioAmount(accountPortfolios, "totalAmountOptions");
  const structuredProducts = sumPortfolioAmount(
    accountPortfolios,
    "totalAmountSp",
  );
  const knownTotal =
    shares + bonds + etf + currencies + futures + options + structuredProducts;
  const reportedTotal = sumPortfolioAmount(
    accountPortfolios,
    "totalAmountPortfolio",
  );
  const totalPortfolio = reportedTotal > 0 ? reportedTotal : knownTotal;
  const other = Math.max(totalPortfolio - knownTotal, 0);

  return {
    totalPortfolio: roundMoney(totalPortfolio),
    shares: roundMoney(shares),
    bonds: roundMoney(bonds),
    etf: roundMoney(etf),
    currencies: roundMoney(currencies),
    futures: roundMoney(futures),
    options: roundMoney(options),
    structuredProducts: roundMoney(structuredProducts),
    other: roundMoney(other),
  };
}

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
    ...(row.currentValue != null ? { currentValue: row.currentValue } : {}),
    ...(row.instrumentType ? { instrumentType: row.instrumentType } : {}),
    ...(row.sector ? { sector: row.sector } : {}),
    ...(row.accountId ? { accountId: row.accountId } : {}),
    ...(row.accountName ? { accountName: row.accountName } : {}),
  } satisfies PositionRow;
}

export async function getPortfolio(
  token: string,
  accountId?: string,
): Promise<PortfolioDto> {
  const tinkoffApi = createTinkoffApi(token);
  const accounts = await listAccounts(token);
  const selectedAccounts = accountId
    ? accounts.filter((account) => account.id === accountId)
    : accounts;

  if (selectedAccounts.length === 0) {
    return {
      accountId: accountId ?? "all",
      accounts: [],
      totals: zeroPortfolioTotals,
      cash: [],
      positions: [],
    };
  }

  const accountPortfolios = await Promise.all(
    selectedAccounts.map(async (account) => {
      const [positionsResponse, portfolioResponse] = await Promise.all([
        tinkoffApi.operations.getPositions({ accountId: account.id }),
        tinkoffApi.operations.getPortfolio({ accountId: account.id }),
      ]);

      return {
        account,
        positionsResponse,
        portfolioResponse,
      };
    }),
  );
  const totals = buildPortfolioTotals(accountPortfolios);

  const cash = accountPortfolios.flatMap(({ account, positionsResponse }) =>
    (positionsResponse.money || []).reduce(
      (accumulator: CashRow[], item: any) => {
        const amount = moneyValueToNumber(item);
        if (amount != null) {
          accumulator.push({
            currency: String(item.currency || ""),
            amount,
            accountId: account.id,
            ...(account.name ? { accountName: account.name } : {}),
          });
        }

        return accumulator;
      },
      [],
    ),
  );

  const rawPositions = accountPortfolios.flatMap(
    ({ account, portfolioResponse }) =>
      ((portfolioResponse.positions || []) as any[]).map((position) => ({
        account,
        position,
      })),
  );
  const uids = rawPositions
    .map(({ position }) => position.instrumentUid || position.uid)
    .filter(Boolean) as string[];

  if (uids.length === 0) {
    return {
      accountId: accountId ?? "all",
      accounts: selectedAccounts,
      totals,
      cash,
      positions: [],
    };
  }

  const [instrumentMeta, lastPricesResponse] = await Promise.all([
    fetchInstrumentMetaByUids(token, uids),
    tinkoffApi.marketdata.getLastPrices({
      instrumentId: uids,
      figi: [],
      lastPriceType: LastPriceType.LAST_PRICE_UNSPECIFIED,
    }),
  ]);

  const lastPriceByUid = new Map<string, any>(
    (lastPricesResponse.lastPrices || []).map((lastPrice: any) => [
      lastPrice.instrumentUid,
      lastPrice,
    ]),
  );

  const positions = rawPositions.flatMap(
    ({ account, position }): PositionRow[] => {
      const uid = position.instrumentUid || position.uid;
      const meta = instrumentMeta.get(uid) || {};
      const instrumentType =
        typeof meta.instrumentType === "string"
          ? meta.instrumentType.toLowerCase()
          : undefined;

      if (instrumentType === "currency") {
        return [];
      }

      const lastPrice = lastPriceByUid.get(uid);
      const quantity = quotationToNumber(position.quantity);
      const portfolioCurrentPrice = moneyValueToNumber(position.currentPrice);
      const marketLastPrice = quotationToNumber(lastPrice?.price);
      const normalizedLastPrice = portfolioCurrentPrice ?? marketLastPrice;
      const currentNkd = moneyValueToNumber(position.currentNkd);
      const currency =
        meta.currency ||
        (position.averagePositionPrice?.currency as string | undefined) ||
        undefined;
      const isBond = instrumentType === "bond";
      const currentValue =
        quantity != null && normalizedLastPrice != null
          ? Number(
              (
                quantity * normalizedLastPrice +
                (isBond && currentNkd != null ? quantity * currentNkd : 0)
              ).toFixed(2),
            )
          : undefined;

      return [
        compactPosition({
          figi: position.figi,
          instrumentUid: uid,
          ticker: meta.ticker,
          name: meta.name,
          currency,
          quantity,
          lastPrice: normalizedLastPrice,
          lastPriceTime: timestampToIso(lastPrice?.time),
          currentValue,
          instrumentType,
          sector: meta.sector,
          accountId: account.id,
          accountName: account.name,
        }),
      ];
    },
  );

  return {
    accountId: accountId ?? "all",
    accounts: selectedAccounts,
    totals,
    cash,
    positions,
  };
}
