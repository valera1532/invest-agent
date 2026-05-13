import { apiClient } from "@/shared/api/http";

export type AiDecisionPreview = {
  id: string;
  accountId?: string;
  status: "proposed" | "approved" | "rejected" | "executed" | "failed";
  executionMode: "manual_approval" | "full_auto";
  createdAt: string;
  updatedAt: string;
  approvalNote?: string;
  tradeExecutions?: Array<{
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
  }>;
  summary: string;
  portfolioView: {
    riskAlignment: "aligned" | "partially_aligned" | "misaligned";
    cashStatus: "underinvested" | "balanced" | "overexposed";
    diversificationStatus: "weak" | "moderate" | "strong";
    portfolioAssessment: string;
  };
  actions: Array<{
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
  }>;
  futureBuyIdeas: Array<{
    instrumentId: string;
    ticker: string;
    instrumentName?: string;
    accountId: string;
    confidence: number;
    thesis: string;
    trigger: string;
    riskNotes: string[];
  }>;
  warnings: string[];
  rejectedIdeas: string[];
};

export async function previewAiDecision(payload?: { accountId?: string }) {
  const response = await apiClient.post<AiDecisionPreview>(
    "/api/ai/decisions/preview",
    payload ?? {},
  );
  return response.data;
}
