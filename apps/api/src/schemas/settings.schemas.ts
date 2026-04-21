import { z } from "zod";

export const investorSettingsSchema = z.object({
  fullName: z.string().trim().min(2, "Укажи имя длиннее двух символов"),
  primaryGoal: z.string().trim().min(10, "Опиши цель хотя бы в 10 символах"),
  riskProfile: z.enum(["conservative", "balanced", "growth", "aggressive"]),
  telegram: z.string().trim().min(2, "Добавь контакт для связи"),
  dailyDigest: z.boolean(),
  executionMode: z.enum(["manual_approval", "full_auto"]),
});

export type InvestorSettingsInput = z.infer<typeof investorSettingsSchema>;
