import type { Request, Response } from "express";
import { HttpError } from "@/lib/http-error";
import { investorSettingsSchema } from "@/schemas/settings.schemas";
import { getInvestorSettings, updateInvestorSettings } from "@/services/settings.service";

export async function getInvestorSettingsController(request: Request, response: Response) {
  if (!request.authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const settings = await getInvestorSettings(request.authUser.id);
  response.json(settings);
}

export async function updateInvestorSettingsController(request: Request, response: Response) {
  if (!request.authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const payload = investorSettingsSchema.parse(request.body);
  const settings = await updateInvestorSettings(request.authUser.id, payload);
  response.json(settings);
}
