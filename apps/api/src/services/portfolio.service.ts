import { LastPriceType } from "tinkoff-invest-api/cjs/generated/marketdata";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import { moneyValueToNumber, quotationToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import { listAccounts } from "@/services/accounts.service";
import { fetchInstrumentMetaByUids } from "@/services/shares.service";
import type { CashRow, PortfolioDto, PositionRow } from "@/types/invest";

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
  accountId?: string | undefined;
  accountName?: string | undefined;
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
    ...(row.currentValue != null ? { currentValue: row.currentValue } : {}),
    ...(row.instrumentType ? { instrumentType: row.instrumentType } : {}),
    ...(row.accountId ? { accountId: row.accountId } : {}),
    ...(row.accountName ? { accountName: row.accountName } : {}),
  } satisfies PositionRow;
}

export async function getPortfolio(token: string, accountId?: string): Promise<PortfolioDto> {
  const tinkoffApi = createTinkoffApi(token);
  const accounts = await listAccounts(token);
  const selectedAccounts = accountId ? accounts.filter((account) => account.id === accountId) : accounts;

  if (selectedAccounts.length === 0) {
    return {
      accountId: accountId ?? "all",
      accounts: [],
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

  const cash = accountPortfolios.flatMap(({ account, positionsResponse }) =>
    (positionsResponse.money || []).reduce((accumulator: CashRow[], item: any) => {
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
    }, []),
  );

  const rawPositions = accountPortfolios.flatMap(({ account, portfolioResponse }) =>
    ((portfolioResponse.positions || []) as any[]).map((position) => ({
      account,
      position,
    })),
  );
  const uids = rawPositions.map(({ position }) => position.instrumentUid || position.uid).filter(Boolean) as string[];

  if (uids.length === 0) {
    return {
      accountId: accountId ?? "all",
      accounts: selectedAccounts,
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
    (lastPricesResponse.lastPrices || []).map((lastPrice: any) => [lastPrice.instrumentUid, lastPrice]),
  );

  const positions = rawPositions.flatMap(({ account, position }): PositionRow[] => {
      const uid = position.instrumentUid || position.uid;
      const meta = instrumentMeta.get(uid) || {};
      const instrumentType = typeof meta.instrumentType === "string" ? meta.instrumentType.toLowerCase() : undefined;

      if (instrumentType === "currency") {
        return [];
      }

      const lastPrice = lastPriceByUid.get(uid);
      const quantity = quotationToNumber(position.quantity);
      const portfolioCurrentPrice = moneyValueToNumber(position.currentPrice);
      const marketLastPrice = quotationToNumber(lastPrice?.price);
      const normalizedLastPrice = portfolioCurrentPrice ?? marketLastPrice;
      const currentNkd = moneyValueToNumber(position.currentNkd);
      const currency = meta.currency || (position.averagePositionPrice?.currency as string | undefined) || undefined;
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

      return [compactPosition({
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
        accountId: account.id,
        accountName: account.name,
      })];
    });

  return {
    accountId: accountId ?? "all",
    accounts: selectedAccounts,
    cash,
    positions,
  };
}
