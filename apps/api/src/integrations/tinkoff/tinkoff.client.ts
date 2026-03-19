import { TinkoffInvestApi } from "tinkoff-invest-api";
import { env } from "@/config/env";
import { HttpError } from "@/lib/http-error";

if (!env.TINKOFF_TOKEN) {
  console.warn("[api] TINKOFF_TOKEN is empty. Tinkoff endpoints will return 500 until the token is set.");
}

export const tinkoffApi = new TinkoffInvestApi({
  token: env.TINKOFF_TOKEN,
});

export async function ensureAccountId(preferredAccountId?: string) {
  if (preferredAccountId) {
    return preferredAccountId;
  }

  const { accounts } = await tinkoffApi.users.getAccounts({});
  const accountId = accounts?.[0]?.id;

  if (!accountId) {
    throw new HttpError(404, "Нет доступных счетов у пользователя");
  }

  return accountId;
}
