import type { SettingsSchema } from "@/features/settings/schema";
import { apiClient } from "@/shared/api/http";

export async function getInvestorSettings() {
  const response = await apiClient.get<SettingsSchema>("/api/settings");
  return response.data;
}

export async function saveInvestorSettings(payload: SettingsSchema) {
  const response = await apiClient.put<SettingsSchema>(
    "/api/settings",
    payload,
  );
  return response.data;
}
