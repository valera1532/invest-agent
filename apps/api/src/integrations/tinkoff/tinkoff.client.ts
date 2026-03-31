import { HttpError } from "@/lib/http-error";
import { createTinkoffApi } from "@/integrations/tinkoff/tinkoff.factory";

export async function ensureAccountId(token: string, preferredAccountId?: string) {
  if (preferredAccountId) {
    return preferredAccountId;
  }

  const tinkoffApi = createTinkoffApi(token);
  const { accounts } = await tinkoffApi.users.getAccounts({});
  const accountId = accounts?.[0]?.id;

  if (!accountId) {
    throw new HttpError(404, "Нет доступных счетов у пользователя");
  }

  return accountId;
}
