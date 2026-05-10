import { z } from "zod";

export const investorQuestionnaireSchema = z.object({
  ageRange: z.enum(["18_24", "25_34", "35_44", "45_54", "55_plus"]),
  experienceLevel: z.enum(["none", "up_to_one_year", "one_to_three_years", "three_plus_years"]),
  investmentGoal: z.enum(["capital_preservation", "passive_income", "balanced_growth", "fast_growth"]),
  investmentHorizon: z.enum(["less_than_one_year", "one_to_three_years", "three_to_five_years", "five_plus_years"]),
  liquidityNeed: z.enum(["anytime", "within_one_year", "in_several_years", "long_term_only"]),
  drawdownTolerance: z.enum(["up_to_10", "up_to_20", "up_to_30", "over_30"]),
  drawdownReaction: z.enum(["reduce_positions", "hold_and_wait", "buy_more"]),
  riskPriority: z.enum(["protect_capital", "balanced_approach", "maximize_growth"]),
  monthlyContribution: z.coerce.number().int().min(0).max(1_000_000),
  aiReviewFrequency: z.enum(["daily", "weekly", "monthly"]),
});

export type InvestorQuestionnaireInput = z.infer<typeof investorQuestionnaireSchema>;
