import { AiExecutionMode, RiskProfile } from "@prisma/client";
import { HttpError } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import type { InvestorSettingsInput } from "@/schemas/settings.schemas";

function mapRiskProfileToClient(value: RiskProfile): InvestorSettingsInput["riskProfile"] {
  switch (value) {
    case RiskProfile.CONSERVATIVE:
      return "conservative";
    case RiskProfile.BALANCED:
      return "balanced";
    case RiskProfile.GROWTH:
      return "growth";
    case RiskProfile.AGGRESSIVE:
      return "aggressive";
  }
}

function mapRiskProfileToDb(value: InvestorSettingsInput["riskProfile"]): RiskProfile {
  switch (value) {
    case "conservative":
      return RiskProfile.CONSERVATIVE;
    case "balanced":
      return RiskProfile.BALANCED;
    case "growth":
      return RiskProfile.GROWTH;
    case "aggressive":
      return RiskProfile.AGGRESSIVE;
  }
}

function mapExecutionModeToClient(value: AiExecutionMode): InvestorSettingsInput["executionMode"] {
  switch (value) {
    case AiExecutionMode.MANUAL_APPROVAL:
      return "manual_approval";
    case AiExecutionMode.FULL_AUTO:
      return "full_auto";
  }
}

function mapExecutionModeToDb(value: InvestorSettingsInput["executionMode"]): AiExecutionMode {
  switch (value) {
    case "manual_approval":
      return AiExecutionMode.MANUAL_APPROVAL;
    case "full_auto":
      return AiExecutionMode.FULL_AUTO;
  }
}

export async function getInvestorSettings(userId: string): Promise<InvestorSettingsInput> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { investorProfile: true },
  });

  if (!user) {
    throw new HttpError(404, "Пользователь не найден");
  }

  return {
    fullName: user.name,
    primaryGoal:
      user.investorProfile?.primaryGoal ??
      "Сформировать понятный инвестиционный портфель под цели пользователя",
    riskProfile: mapRiskProfileToClient(user.investorProfile?.riskProfile ?? RiskProfile.BALANCED),
    telegram: user.investorProfile?.telegram ?? "@invest_agent_demo",
    dailyDigest: user.investorProfile?.dailyDigest ?? true,
    executionMode: mapExecutionModeToClient(
      user.investorProfile?.executionMode ?? AiExecutionMode.MANUAL_APPROVAL,
    ),
  };
}

export async function updateInvestorSettings(userId: string, input: InvestorSettingsInput): Promise<InvestorSettingsInput> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.fullName,
      investorProfile: {
        upsert: {
          create: {
            primaryGoal: input.primaryGoal,
            riskProfile: mapRiskProfileToDb(input.riskProfile),
            telegram: input.telegram,
            dailyDigest: input.dailyDigest,
            executionMode: mapExecutionModeToDb(input.executionMode),
          },
          update: {
            primaryGoal: input.primaryGoal,
            riskProfile: mapRiskProfileToDb(input.riskProfile),
            telegram: input.telegram,
            dailyDigest: input.dailyDigest,
            executionMode: mapExecutionModeToDb(input.executionMode),
          },
        },
      },
    },
    include: { investorProfile: true },
  });

  return {
    fullName: updated.name,
    primaryGoal: updated.investorProfile?.primaryGoal ?? input.primaryGoal,
    riskProfile: mapRiskProfileToClient(updated.investorProfile?.riskProfile ?? RiskProfile.BALANCED),
    telegram: updated.investorProfile?.telegram ?? input.telegram,
    dailyDigest: updated.investorProfile?.dailyDigest ?? input.dailyDigest,
    executionMode: mapExecutionModeToClient(
      updated.investorProfile?.executionMode ?? mapExecutionModeToDb(input.executionMode),
    ),
  };
}
