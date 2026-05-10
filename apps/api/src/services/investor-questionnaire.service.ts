import {
  AgeRange,
  AiReviewFrequency,
  DrawdownReaction,
  DrawdownTolerance,
  ExperienceLevel,
  InvestmentGoal,
  InvestmentHorizon,
  LiquidityNeed,
  RiskPriority,
  RiskProfile,
} from "@prisma/client";
import { HttpError } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import type { InvestorQuestionnaireInput } from "@/schemas/investor-questionnaire.schemas";

export type InvestorQuestionnaireDto = InvestorQuestionnaireInput & {
  recommendedRiskProfile: "conservative" | "balanced" | "growth" | "aggressive";
  completedAt: string | null;
};

const questionnaireDefaults: InvestorQuestionnaireInput = {
  ageRange: "25_34",
  experienceLevel: "none",
  investmentGoal: "balanced_growth",
  investmentHorizon: "three_to_five_years",
  liquidityNeed: "in_several_years",
  drawdownTolerance: "up_to_20",
  drawdownReaction: "hold_and_wait",
  riskPriority: "balanced_approach",
  monthlyContribution: 30000,
  aiReviewFrequency: "daily",
};

function mapAgeRangeToDb(value: InvestorQuestionnaireInput["ageRange"]): AgeRange {
  return {
    "18_24": AgeRange.AGE_18_24,
    "25_34": AgeRange.AGE_25_34,
    "35_44": AgeRange.AGE_35_44,
    "45_54": AgeRange.AGE_45_54,
    "55_plus": AgeRange.AGE_55_PLUS,
  }[value];
}

function mapAgeRangeToClient(value: AgeRange): InvestorQuestionnaireInput["ageRange"] {
  const mapped: Record<AgeRange, InvestorQuestionnaireInput["ageRange"]> = {
    [AgeRange.AGE_18_24]: "18_24",
    [AgeRange.AGE_25_34]: "25_34",
    [AgeRange.AGE_35_44]: "35_44",
    [AgeRange.AGE_45_54]: "45_54",
    [AgeRange.AGE_55_PLUS]: "55_plus",
  };
  return mapped[value];
}

function mapExperienceToDb(value: InvestorQuestionnaireInput["experienceLevel"]): ExperienceLevel {
  return {
    none: ExperienceLevel.NONE,
    up_to_one_year: ExperienceLevel.UP_TO_ONE_YEAR,
    one_to_three_years: ExperienceLevel.ONE_TO_THREE_YEARS,
    three_plus_years: ExperienceLevel.THREE_PLUS_YEARS,
  }[value];
}

function mapExperienceToClient(value: ExperienceLevel): InvestorQuestionnaireInput["experienceLevel"] {
  const mapped: Record<ExperienceLevel, InvestorQuestionnaireInput["experienceLevel"]> = {
    [ExperienceLevel.NONE]: "none",
    [ExperienceLevel.UP_TO_ONE_YEAR]: "up_to_one_year",
    [ExperienceLevel.ONE_TO_THREE_YEARS]: "one_to_three_years",
    [ExperienceLevel.THREE_PLUS_YEARS]: "three_plus_years",
  };
  return mapped[value];
}

function mapInvestmentGoalToDb(value: InvestorQuestionnaireInput["investmentGoal"]): InvestmentGoal {
  return {
    capital_preservation: InvestmentGoal.CAPITAL_PRESERVATION,
    passive_income: InvestmentGoal.PASSIVE_INCOME,
    balanced_growth: InvestmentGoal.BALANCED_GROWTH,
    fast_growth: InvestmentGoal.FAST_GROWTH,
  }[value];
}

function mapInvestmentGoalToClient(value: InvestmentGoal): InvestorQuestionnaireInput["investmentGoal"] {
  const mapped: Record<InvestmentGoal, InvestorQuestionnaireInput["investmentGoal"]> = {
    [InvestmentGoal.CAPITAL_PRESERVATION]: "capital_preservation",
    [InvestmentGoal.PASSIVE_INCOME]: "passive_income",
    [InvestmentGoal.BALANCED_GROWTH]: "balanced_growth",
    [InvestmentGoal.FAST_GROWTH]: "fast_growth",
  };
  return mapped[value];
}

function mapHorizonToDb(value: InvestorQuestionnaireInput["investmentHorizon"]): InvestmentHorizon {
  return {
    less_than_one_year: InvestmentHorizon.LESS_THAN_ONE_YEAR,
    one_to_three_years: InvestmentHorizon.ONE_TO_THREE_YEARS,
    three_to_five_years: InvestmentHorizon.THREE_TO_FIVE_YEARS,
    five_plus_years: InvestmentHorizon.FIVE_PLUS_YEARS,
  }[value];
}

function mapHorizonToClient(value: InvestmentHorizon): InvestorQuestionnaireInput["investmentHorizon"] {
  const mapped: Record<InvestmentHorizon, InvestorQuestionnaireInput["investmentHorizon"]> = {
    [InvestmentHorizon.LESS_THAN_ONE_YEAR]: "less_than_one_year",
    [InvestmentHorizon.ONE_TO_THREE_YEARS]: "one_to_three_years",
    [InvestmentHorizon.THREE_TO_FIVE_YEARS]: "three_to_five_years",
    [InvestmentHorizon.FIVE_PLUS_YEARS]: "five_plus_years",
  };
  return mapped[value];
}

function mapLiquidityToDb(value: InvestorQuestionnaireInput["liquidityNeed"]): LiquidityNeed {
  return {
    anytime: LiquidityNeed.ANYTIME,
    within_one_year: LiquidityNeed.WITHIN_ONE_YEAR,
    in_several_years: LiquidityNeed.IN_SEVERAL_YEARS,
    long_term_only: LiquidityNeed.LONG_TERM_ONLY,
  }[value];
}

function mapLiquidityToClient(value: LiquidityNeed): InvestorQuestionnaireInput["liquidityNeed"] {
  const mapped: Record<LiquidityNeed, InvestorQuestionnaireInput["liquidityNeed"]> = {
    [LiquidityNeed.ANYTIME]: "anytime",
    [LiquidityNeed.WITHIN_ONE_YEAR]: "within_one_year",
    [LiquidityNeed.IN_SEVERAL_YEARS]: "in_several_years",
    [LiquidityNeed.LONG_TERM_ONLY]: "long_term_only",
  };
  return mapped[value];
}

function mapDrawdownToleranceToDb(value: InvestorQuestionnaireInput["drawdownTolerance"]): DrawdownTolerance {
  return {
    up_to_10: DrawdownTolerance.UP_TO_10,
    up_to_20: DrawdownTolerance.UP_TO_20,
    up_to_30: DrawdownTolerance.UP_TO_30,
    over_30: DrawdownTolerance.OVER_30,
  }[value];
}

function mapDrawdownToleranceToClient(value: DrawdownTolerance): InvestorQuestionnaireInput["drawdownTolerance"] {
  const mapped: Record<DrawdownTolerance, InvestorQuestionnaireInput["drawdownTolerance"]> = {
    [DrawdownTolerance.UP_TO_10]: "up_to_10",
    [DrawdownTolerance.UP_TO_20]: "up_to_20",
    [DrawdownTolerance.UP_TO_30]: "up_to_30",
    [DrawdownTolerance.OVER_30]: "over_30",
  };
  return mapped[value];
}

function mapDrawdownReactionToDb(value: InvestorQuestionnaireInput["drawdownReaction"]): DrawdownReaction {
  return {
    reduce_positions: DrawdownReaction.REDUCE_POSITIONS,
    hold_and_wait: DrawdownReaction.HOLD_AND_WAIT,
    buy_more: DrawdownReaction.BUY_MORE,
  }[value];
}

function mapDrawdownReactionToClient(value: DrawdownReaction): InvestorQuestionnaireInput["drawdownReaction"] {
  const mapped: Record<DrawdownReaction, InvestorQuestionnaireInput["drawdownReaction"]> = {
    [DrawdownReaction.REDUCE_POSITIONS]: "reduce_positions",
    [DrawdownReaction.HOLD_AND_WAIT]: "hold_and_wait",
    [DrawdownReaction.BUY_MORE]: "buy_more",
  };
  return mapped[value];
}

function mapRiskPriorityToDb(value: InvestorQuestionnaireInput["riskPriority"]): RiskPriority {
  return {
    protect_capital: RiskPriority.PROTECT_CAPITAL,
    balanced_approach: RiskPriority.BALANCED_APPROACH,
    maximize_growth: RiskPriority.MAXIMIZE_GROWTH,
  }[value];
}

function mapRiskPriorityToClient(value: RiskPriority): InvestorQuestionnaireInput["riskPriority"] {
  const mapped: Record<RiskPriority, InvestorQuestionnaireInput["riskPriority"]> = {
    [RiskPriority.PROTECT_CAPITAL]: "protect_capital",
    [RiskPriority.BALANCED_APPROACH]: "balanced_approach",
    [RiskPriority.MAXIMIZE_GROWTH]: "maximize_growth",
  };
  return mapped[value];
}

function mapAiReviewFrequencyToDb(value: InvestorQuestionnaireInput["aiReviewFrequency"]): AiReviewFrequency {
  return {
    daily: AiReviewFrequency.DAILY,
    weekly: AiReviewFrequency.WEEKLY,
    monthly: AiReviewFrequency.MONTHLY,
  }[value];
}

function mapAiReviewFrequencyToClient(value: AiReviewFrequency): InvestorQuestionnaireInput["aiReviewFrequency"] {
  const mapped: Record<AiReviewFrequency, InvestorQuestionnaireInput["aiReviewFrequency"]> = {
    [AiReviewFrequency.DAILY]: "daily",
    [AiReviewFrequency.WEEKLY]: "weekly",
    [AiReviewFrequency.MONTHLY]: "monthly",
  };
  return mapped[value];
}

function mapRiskProfileToClient(value: RiskProfile): InvestorQuestionnaireDto["recommendedRiskProfile"] {
  const mapped: Record<RiskProfile, InvestorQuestionnaireDto["recommendedRiskProfile"]> = {
    [RiskProfile.CONSERVATIVE]: "conservative",
    [RiskProfile.BALANCED]: "balanced",
    [RiskProfile.GROWTH]: "growth",
    [RiskProfile.AGGRESSIVE]: "aggressive",
  };
  return mapped[value];
}

function mapRiskProfileToDb(value: InvestorQuestionnaireDto["recommendedRiskProfile"]): RiskProfile {
  return {
    conservative: RiskProfile.CONSERVATIVE,
    balanced: RiskProfile.BALANCED,
    growth: RiskProfile.GROWTH,
    aggressive: RiskProfile.AGGRESSIVE,
  }[value];
}

function deriveRiskProfile(input: InvestorQuestionnaireInput): InvestorQuestionnaireDto["recommendedRiskProfile"] {
  let score = 0;

  score += {
    capital_preservation: -2,
    passive_income: -1,
    balanced_growth: 1,
    fast_growth: 3,
  }[input.investmentGoal];

  score += {
    less_than_one_year: -2,
    one_to_three_years: 0,
    three_to_five_years: 1,
    five_plus_years: 2,
  }[input.investmentHorizon];

  score += {
    anytime: -2,
    within_one_year: -1,
    in_several_years: 1,
    long_term_only: 2,
  }[input.liquidityNeed];

  score += {
    up_to_10: -2,
    up_to_20: -1,
    up_to_30: 1,
    over_30: 3,
  }[input.drawdownTolerance];

  score += {
    reduce_positions: -2,
    hold_and_wait: 0,
    buy_more: 2,
  }[input.drawdownReaction];

  score += {
    protect_capital: -2,
    balanced_approach: 0,
    maximize_growth: 2,
  }[input.riskPriority];

  score += {
    none: -1,
    up_to_one_year: 0,
    one_to_three_years: 1,
    three_plus_years: 2,
  }[input.experienceLevel];

  score += {
    "18_24": 1,
    "25_34": 1,
    "35_44": 0,
    "45_54": 0,
    "55_plus": -1,
  }[input.ageRange];

  if (score <= -4) {
    return "conservative";
  }
  if (score <= 2) {
    return "balanced";
  }
  if (score <= 7) {
    return "growth";
  }

  return "aggressive";
}

function buildPrimaryGoal(goal: InvestorQuestionnaireInput["investmentGoal"]) {
  return {
    capital_preservation: "Сохранять капитал и избегать глубоких просадок, даже если рост портфеля будет умеренным.",
    passive_income: "Формировать долгосрочный портфель для регулярного денежного потока и стабильного реинвестирования.",
    balanced_growth: "Сочетать рост капитала и разумную устойчивость портфеля без экстремального риска.",
    fast_growth: "Стремиться к быстрому росту капитала, принимая повышенную волатильность и рыночный риск.",
  }[goal];
}

function toDto(record: {
  ageRange: AgeRange;
  experienceLevel: ExperienceLevel;
  investmentGoal: InvestmentGoal;
  investmentHorizon: InvestmentHorizon;
  liquidityNeed: LiquidityNeed;
  drawdownTolerance: DrawdownTolerance;
  drawdownReaction: DrawdownReaction;
  riskPriority: RiskPriority;
  monthlyContribution: number;
  aiReviewFrequency: AiReviewFrequency;
  completedAt: Date;
}, recommendedRiskProfile: InvestorQuestionnaireDto["recommendedRiskProfile"]): InvestorQuestionnaireDto {
  return {
    ageRange: mapAgeRangeToClient(record.ageRange),
    experienceLevel: mapExperienceToClient(record.experienceLevel),
    investmentGoal: mapInvestmentGoalToClient(record.investmentGoal),
    investmentHorizon: mapHorizonToClient(record.investmentHorizon),
    liquidityNeed: mapLiquidityToClient(record.liquidityNeed),
    drawdownTolerance: mapDrawdownToleranceToClient(record.drawdownTolerance),
    drawdownReaction: mapDrawdownReactionToClient(record.drawdownReaction),
    riskPriority: mapRiskPriorityToClient(record.riskPriority),
    monthlyContribution: record.monthlyContribution,
    aiReviewFrequency: mapAiReviewFrequencyToClient(record.aiReviewFrequency),
    recommendedRiskProfile,
    completedAt: record.completedAt.toISOString(),
  };
}

export async function getInvestorQuestionnaire(userId: string): Promise<InvestorQuestionnaireDto> {
  const questionnaire = await prisma.investorQuestionnaire.findUnique({ where: { userId } });
  if (!questionnaire) {
    const recommendedRiskProfile = deriveRiskProfile(questionnaireDefaults);
    return {
      ...questionnaireDefaults,
      recommendedRiskProfile,
      completedAt: null,
    };
  }

  return toDto(questionnaire, mapRiskProfileToClient((await prisma.investorProfile.findUnique({ where: { userId } }))?.riskProfile ?? mapRiskProfileToDb(deriveRiskProfile(questionnaireDefaults))));
}

export async function saveInvestorQuestionnaire(userId: string, input: InvestorQuestionnaireInput): Promise<InvestorQuestionnaireDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "Пользователь не найден");
  }

  const recommendedRiskProfile = deriveRiskProfile(input);
  const completedAt = new Date();

  const questionnaire = await prisma.investorQuestionnaire.upsert({
    where: { userId },
    create: {
      userId,
      ageRange: mapAgeRangeToDb(input.ageRange),
      experienceLevel: mapExperienceToDb(input.experienceLevel),
      investmentGoal: mapInvestmentGoalToDb(input.investmentGoal),
      investmentHorizon: mapHorizonToDb(input.investmentHorizon),
      liquidityNeed: mapLiquidityToDb(input.liquidityNeed),
      drawdownTolerance: mapDrawdownToleranceToDb(input.drawdownTolerance),
      drawdownReaction: mapDrawdownReactionToDb(input.drawdownReaction),
      riskPriority: mapRiskPriorityToDb(input.riskPriority),
      monthlyContribution: input.monthlyContribution,
      aiReviewFrequency: mapAiReviewFrequencyToDb(input.aiReviewFrequency),
      completedAt,
    },
    update: {
      ageRange: mapAgeRangeToDb(input.ageRange),
      experienceLevel: mapExperienceToDb(input.experienceLevel),
      investmentGoal: mapInvestmentGoalToDb(input.investmentGoal),
      investmentHorizon: mapHorizonToDb(input.investmentHorizon),
      liquidityNeed: mapLiquidityToDb(input.liquidityNeed),
      drawdownTolerance: mapDrawdownToleranceToDb(input.drawdownTolerance),
      drawdownReaction: mapDrawdownReactionToDb(input.drawdownReaction),
      riskPriority: mapRiskPriorityToDb(input.riskPriority),
      monthlyContribution: input.monthlyContribution,
      aiReviewFrequency: mapAiReviewFrequencyToDb(input.aiReviewFrequency),
      completedAt,
    },
  });

  await prisma.investorProfile.upsert({
    where: { userId },
    create: {
      userId,
      primaryGoal: buildPrimaryGoal(input.investmentGoal),
      riskProfile: mapRiskProfileToDb(recommendedRiskProfile),
      aiReviewFrequency: mapAiReviewFrequencyToDb(input.aiReviewFrequency),
    },
    update: {
      primaryGoal: buildPrimaryGoal(input.investmentGoal),
      riskProfile: mapRiskProfileToDb(recommendedRiskProfile),
      aiReviewFrequency: mapAiReviewFrequencyToDb(input.aiReviewFrequency),
    },
  });

  return toDto(questionnaire, recommendedRiskProfile);
}
