import { apiClient } from "@/shared/api/http";
import type { AiDecisionPreview } from "@/features/ai/api/preview-ai-decision";

export type AiDecisionRecord = AiDecisionPreview;

export type AiDecisionHistoryPage = {
  items: AiDecisionRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getAiDecisionHistory(page = 1, limit = 10) {
  const response = await apiClient.get<AiDecisionHistoryPage>(
    "/api/ai/decisions",
    {
      params: { page, limit },
    },
  );
  return response.data;
}

export async function approveAiDecision(id: string, note?: string) {
  const response = await apiClient.post<AiDecisionRecord>(
    `/api/ai/decisions/${id}/approve`,
    note ? { note } : {},
  );
  return response.data;
}

export async function rejectAiDecision(id: string, note?: string) {
  const response = await apiClient.post<AiDecisionRecord>(
    `/api/ai/decisions/${id}/reject`,
    note ? { note } : {},
  );
  return response.data;
}
