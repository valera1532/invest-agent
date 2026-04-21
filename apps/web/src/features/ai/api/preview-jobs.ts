import { apiClient } from "@/shared/api/http";
import type { AiDecisionRecord } from "@/features/ai/api/decision-history";

export type AiPreviewJob = {
  id: string;
  accountId?: string;
  status: "queued" | "running" | "completed" | "failed";
  stage?:
    | "collecting_portfolio"
    | "analyzing_history"
    | "building_universe"
    | "preparing_context"
    | "requesting_ai"
    | "saving_decision";
  errorMessage?: string;
  decisionId?: string;
  decision?: AiDecisionRecord;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
};

export async function createAiPreviewJob(payload?: { accountId?: string }) {
  const response = await apiClient.post<AiPreviewJob>(
    "/api/ai/preview-jobs",
    payload ?? {},
  );
  return response.data;
}

export async function getAiPreviewJob(id: string) {
  const response = await apiClient.get<AiPreviewJob>(
    `/api/ai/preview-jobs/${id}`,
  );
  return response.data;
}
