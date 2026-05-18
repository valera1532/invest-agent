export type ShareRow = {
  ticker: string;
  figi?: string;
  instrumentUid?: string;
  name: string;
  currency?: string;
  lastPrice?: number;
  lastPriceTime?: string;
};

export type ShareSearchRow = {
  instrumentId: string;
  ticker: string;
  figi?: string;
  name: string;
  currency?: string;
  lot: number;
  lastPrice?: number;
  lastPriceTime?: string;
};

export type BuyOrderResultDto = {
  orderId: string;
  executionStatus: string;
  lotsRequested: number;
  lotsExecuted: number;
  instrumentUid: string;
  message: string;
  totalOrderAmount?: number;
};

export type CashRow = {
  currency: string;
  amount: number;
  accountId?: string;
  accountName?: string;
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
  currentValue?: number;
  instrumentType?: string;
  sector?: string;
  accountId?: string;
  accountName?: string;
};

export type PortfolioTotalsDto = {
  totalPortfolio: number;
  shares: number;
  bonds: number;
  etf: number;
  currencies: number;
  futures: number;
  options: number;
  structuredProducts: number;
  other: number;
};

export type PortfolioDto = {
  accountId: string;
  accounts: AccountRow[];
  totals: PortfolioTotalsDto;
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
