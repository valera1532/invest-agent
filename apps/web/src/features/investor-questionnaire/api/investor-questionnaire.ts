import { apiClient } from "@/shared/api/http";
import type {
  InvestorQuestionnaireResult,
  InvestorQuestionnaireSchema,
} from "@/features/investor-questionnaire/schema";

export async function getInvestorQuestionnaire() {
  const response = await apiClient.get<InvestorQuestionnaireResult>(
    "/api/investor-questionnaire",
  );
  return response.data;
}

export async function saveInvestorQuestionnaire(
  payload: InvestorQuestionnaireSchema,
) {
  const response = await apiClient.put<InvestorQuestionnaireResult>(
    "/api/investor-questionnaire",
    payload,
  );
  return response.data;
}
