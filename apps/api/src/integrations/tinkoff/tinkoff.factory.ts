import { TinkoffInvestApi } from "tinkoff-invest-api";

export function createTinkoffApi(token: string) {
  return new TinkoffInvestApi({ token });
}
