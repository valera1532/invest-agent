import { TinkoffInvestApi } from "tinkoff-invest-api";
import { SignalServiceDefinition } from "tinkoff-invest-api/cjs/generated/signals";
import type { SignalServiceClient } from "tinkoff-invest-api/cjs/generated/signals";

export function createTinkoffApi(token: string) {
  return new TinkoffInvestApi({ token });
}

export function createTinkoffSignalsClient(token: string): SignalServiceClient {
  const api = createTinkoffApi(token);
  const privateClientAccessor = api as unknown as {
    getOrCreateClient: (service: typeof SignalServiceDefinition) => SignalServiceClient;
  };

  return privateClientAccessor.getOrCreateClient(SignalServiceDefinition);
}
