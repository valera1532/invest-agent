import { tinkoffApi } from "@/integrations/tinkoff/tinkoff.client";
import { moneyValueToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import type { AccountRow, CashRow, MarginAttributesDto, TariffDto } from "@/types/invest";

export async function listAccounts(): Promise<AccountRow[]> {
  const { accounts } = await tinkoffApi.users.getAccounts({});

  return (accounts || []).map((account: any) => {
    const row: AccountRow = { id: String(account.id) };

    if (account.name) {
      row.name = String(account.name);
    }

    if (account.type != null) {
      row.type = String(account.type);
    }

    if (account.status != null) {
      row.status = String(account.status);
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
}

export async function getMarginAttributes(accountId: string): Promise<MarginAttributesDto> {
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

export async function getUserTariff(): Promise<TariffDto> {
  return (await tinkoffApi.users.getUserTariff({})) as unknown;
}
