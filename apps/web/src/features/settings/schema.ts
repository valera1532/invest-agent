import { z } from "zod";

export const settingsSchema = z.object({
  fullName: z.string().min(2, "Укажи имя длиннее двух символов"),
  primaryGoal: z.string().min(10, "Опиши цель хотя бы в 10 символах"),
  riskProfile: z.enum(["conservative", "balanced", "growth", "aggressive"]),
  telegram: z.string().min(2, "Добавь контакт для связи"),
  dailyDigest: z.boolean(),
  executionMode: z.enum(["manual_approval", "full_auto"]),
  aiReviewFrequency: z.enum(["daily", "weekly", "monthly"]),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;
