import type { Request, Response } from "express";
import { HttpError } from "@/lib/http-error";
import { investorQuestionnaireSchema } from "@/schemas/investor-questionnaire.schemas";
import { getInvestorQuestionnaire, saveInvestorQuestionnaire } from "@/services/investor-questionnaire.service";

export async function getInvestorQuestionnaireController(request: Request, response: Response) {
  if (!request.authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const questionnaire = await getInvestorQuestionnaire(request.authUser.id);
  response.json(questionnaire);
}

export async function saveInvestorQuestionnaireController(request: Request, response: Response) {
  if (!request.authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const payload = investorQuestionnaireSchema.parse(request.body);
  const questionnaire = await saveInvestorQuestionnaire(request.authUser.id, payload);
  response.json(questionnaire);
}
