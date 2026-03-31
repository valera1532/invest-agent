import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";
import { moneyValueToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import { createTtlCache } from "@/lib/cache";
import type { AccountRow, CashRow, MarginAttributesDto, TariffDto } from "@/types/invest";

const accountsCache = createTtlCache<AccountRow[]>();
const ACCOUNTS_CACHE_TTL_MS = 60_000;

const accountTypeLabels: Record<string, string> = {
  "1": "Брокерский счет",
  "2": "ИИС",
  "3": "Инвесткопилка",
};

const accountStatusLabels: Record<string, string> = {
  "1": "Новый",
  "2": "Открыт",
  "3": "Закрыт",
};

function mapAccountType(value?: string) {
  if (!value) {
    return undefined;
  }

  return accountTypeLabels[value] ?? value;
}

function mapAccountStatus(value?: string) {
  if (!value) {
    return undefined;
  }

  return accountStatusLabels[value] ?? value;
}

export async function listAccounts(token: string): Promise<AccountRow[]> {
  const cacheKey = token;
  const cachedAccounts = accountsCache.get(cacheKey);

  if (cachedAccounts) {
    return cachedAccounts;
  }

  const tinkoffApi = createTinkoffApi(token);
  const { accounts } = await tinkoffApi.users.getAccounts({});

  const mappedAccounts = (accounts || []).map((account: any) => {
    const row: AccountRow = { id: String(account.id) };

    if (account.name) {
      row.name = String(account.name);
    }

    if (account.type != null) {
      const accountType = mapAccountType(String(account.type));
      if (accountType) {
        row.type = accountType;
      }
    }

    if (account.status != null) {
      const accountStatus = mapAccountStatus(String(account.status));
      if (accountStatus) {
        row.status = accountStatus;
      }
    }

    const openedDate = timestampToIso(account.openedDate);
    if (openedDate) {
      row.openedDate = openedDate;
    }

    const closedDate = timestampToIso(account.closedDate);
    if (closedDate) {
      row.closedDate = closedDate;
    }

    return row;
  });

  accountsCache.set(cacheKey, mappedAccounts, ACCOUNTS_CACHE_TTL_MS);
  return mappedAccounts;
}

export async function getMarginAttributes(token: string, accountId: string): Promise<MarginAttributesDto> {
  const tinkoffApi = createTinkoffApi(token);
  try {
    const response: any = await tinkoffApi.users.getMarginAttributes({ accountId });

    return {
      marginEnabled: true,
      liquidPortfolio: moneyValueToNumber(response.liquidPortfolio) ?? 0,
      startingMargin: moneyValueToNumber(response.startingMargin) ?? 0,
      minimalMargin: moneyValueToNumber(response.minimalMargin) ?? 0,
      fundsSufficiencyLevel: response?.fundsSufficiencyLevel
        ? Number(
            (typeof response.fundsSufficiencyLevel.units === "string"
              ? parseInt(response.fundsSufficiencyLevel.units, 10)
              : response.fundsSufficiencyLevel.units) +
              (response.fundsSufficiencyLevel.nano || 0) / 1e9,
          )
        : null,
    };
  } catch (error: any) {
    const message = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
    const isMarginDisabled = message.includes("margin status is disabled") || error?.code === 3;

    if (!isMarginDisabled) {
      throw error;
    }

    const positionsResponse = await tinkoffApi.operations.getPositions({ accountId });
    const cash = (positionsResponse.money || []).reduce((accumulator: CashRow[], item: any) => {
      const amount = moneyValueToNumber(item);
      if (amount != null) {
        accumulator.push({
          currency: String(item.currency || ""),
          amount,
          accountId,
        });
      }

      return accumulator;
    }, []);

    return {
      marginEnabled: false,
      liquidPortfolio: null,
      startingMargin: null,
      minimalMargin: null,
      fundsSufficiencyLevel: null,
      cash,
    };
  }
}

export async function getUserTariff(token: string): Promise<TariffDto> {
  const tinkoffApi = createTinkoffApi(token);
  return (await tinkoffApi.users.getUserTariff({})) as unknown;
}
