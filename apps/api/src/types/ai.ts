export type AiAssetClass = "share" | "bond" | "etf" | "currency";

export type AiUniverseInstrument = {
  instrumentId: string;
  ticker: string;
  name: string;
  assetClass: AiAssetClass;
  currency?: string;
  lot: number;
  lastPrice?: number;
  lastPriceTime?: string;
};

export type AiBrokerResearchDirection = "buy" | "sell";

export type AiBrokerResearchSignal = {
  instrumentId: string;
  ticker: string;
  instrumentName: string;
  source: string;
  direction: AiBrokerResearchDirection;
  strategyType: "fundamental";
  signalName: string;
  targetPrice?: number;
  probability?: number;
  createdAt?: string;
  expiresAt?: string;
};

export type AiBrokerResearchContext = {
  fetchedAt: string;
  sources: string[];
  filters: {
    strategyType: "fundamental";
    active: "active";
    maxSignalsPerInstrument: number;
  };
  signals: AiBrokerResearchSignal[];
  missingActiveSignalsForTickers: string[];
  unavailableReason?: string;
};

export type AiPortfolioView = {
  riskAlignment: "aligned" | "partially_aligned" | "misaligned";
  cashStatus: "underinvested" | "balanced" | "overexposed";
  diversificationStatus: "weak" | "moderate" | "strong";
  portfolioAssessment: string;
};

export type AiDecisionAction = {
  type: "buy" | "sell" | "hold";
  instrumentId: string;
  ticker: string;
  instrumentName?: string;
  accountId: string;
  lots: number;
  confidence: number;
  thesis: string;
  portfolioImpact: string;
  riskNotes: string[];
};

export type AiFutureBuyIdea = {
  instrumentId: string;
  ticker: string;
  instrumentName?: string;
  accountId: string;
  confidence: number;
  thesis: string;
  trigger: string;
  riskNotes: string[];
};

export type AiDecisionPreviewDto = {
  summary: string;
  portfolioView: AiPortfolioView;
  actions: AiDecisionAction[];
  futureBuyIdeas: AiFutureBuyIdea[];
  warnings: string[];
  rejectedIdeas: string[];
};

export type AiDecisionStatusDto = "proposed" | "approved" | "rejected" | "executed" | "failed";

export type AiTradeExecutionDto = {
  id: string;
  status: "pending" | "success" | "failed" | "cancelled";
  actionType: string;
  instrumentId: string;
  accountId: string;
  lots: number;
  brokerOrderId?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type AiDecisionRecordDto = AiDecisionPreviewDto & {
  id: string;
  accountId?: string;
  status: AiDecisionStatusDto;
  executionMode: "manual_approval" | "full_auto";
  createdAt: string;
  updatedAt: string;
  approvalNote?: string;
  tradeExecutions?: AiTradeExecutionDto[];
};

export type AiDecisionListDto = {
  items: AiDecisionRecordDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AiPreviewJobStatusDto = "queued" | "running" | "completed" | "failed";

export type AiPreviewJobStageDto =
  | "collecting_portfolio"
  | "analyzing_history"
  | "building_universe"
  | "preparing_context"
  | "requesting_ai"
  | "saving_decision";

export type AiPreviewJobDto = {
  id: string;
  accountId?: string;
  status: AiPreviewJobStatusDto;
  stage?: AiPreviewJobStageDto;
  errorMessage?: string;
  decisionId?: string;
  decision?: AiDecisionRecordDto;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
};
