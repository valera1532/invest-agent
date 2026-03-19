export type ShareRow = {
  ticker: string;
  figi?: string;
  instrumentUid?: string;
  name: string;
  currency?: string;
  lastPrice?: number;
  lastPriceTime?: string;
};

export type CashRow = {
  currency: string;
  amount: number;
};

export type PositionRow = {
  figi?: string;
  instrumentUid?: string;
  ticker?: string;
  name?: string;
  currency?: string;
  quantity?: number;
  lastPrice?: number;
  lastPriceTime?: string;
};

export type PortfolioDto = {
  accountId: string;
  cash: CashRow[];
  positions: PositionRow[];
};

export type AccountRow = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  openedDate?: string;
  closedDate?: string;
};

export type MarginAttributesDto = {
  marginEnabled: boolean;
  liquidPortfolio: number | null;
  startingMargin: number | null;
  minimalMargin: number | null;
  fundsSufficiencyLevel: number | null;
  cash?: CashRow[];
};

export type TariffDto = unknown;
