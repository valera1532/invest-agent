import { aiDecisionPreviewSchema } from "@/schemas/ai.schemas";
import { prisma } from "@/lib/prisma";
import { listAccounts } from "@/services/accounts.service";
import { buildMultiAssetUniverse, selectUniverseForRiskProfile } from "@/services/ai-market-universe.service";
import { persistAiDecision } from "@/services/ai-decision-records.service";
import { getPortfolio } from "@/services/portfolio.service";
import { getInvestorSettings } from "@/services/settings.service";
import { createJsonChatCompletion } from "@/ai/openai.client";
import {
  baseSystemPrompt,
  buildGoalPrompt,
  commonDecisionPrompt,
  executionPolicyPrompt,
  futureIdeasPrompt,
  outputSchemaPrompt,
  strategyOverlays,
} from "@/ai/prompt-templates";
import type { AiDecisionPreviewDto, AiDecisionRecordDto, AiPreviewJobStageDto } from "@/types/ai";

const AI_HISTORY_WINDOW_DAYS = 60;

function subtractDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function ensureFutureBuyIdeasCount(params: {
  futureBuyIdeas: AiDecisionPreviewDto["futureBuyIdeas"];
  selectedUniverse: Awaited<ReturnType<typeof buildMultiAssetUniverse>>;
  accounts: Awaited<ReturnType<typeof listAccounts>>;
  portfolio: Awaited<ReturnType<typeof getPortfolio>>;
}) {
  const { futureBuyIdeas, selectedUniverse, accounts, portfolio } = params;
  const result = [...futureBuyIdeas];
  const seenInstrumentIds = new Set(result.map((idea) => idea.instrumentId));
  const accountId = portfolio.accountId || accounts[0]?.id || "";

  if (!accountId) {
    return result;
  }

  for (const instrument of selectedUniverse) {
    if (result.length >= 10) {
      break;
    }

    if (seenInstrumentIds.has(instrument.instrumentId)) {
      continue;
    }

    seenInstrumentIds.add(instrument.instrumentId);
    result.push({
      instrumentId: instrument.instrumentId,
      ticker: instrument.ticker,
      instrumentName: instrument.name,
      accountId,
      confidence: 0.35,
      thesis: `${instrument.name} fits the current universe and remains worth watching for a later entry.`,
      trigger: "Wait for a stronger portfolio fit, more free cash, or a higher-conviction rebalance window.",
      riskNotes: ["Fallback watchlist idea added by backend to keep a full future ideas list."],
    });
  }

  return result.slice(0, 10);
}

function buildPortfolioMetrics(portfolio: Awaited<ReturnType<typeof getPortfolio>>) {
  const totalCash = portfolio.cash.reduce((sum, item) => sum + item.amount, 0);
  const totalPositionsValue = portfolio.positions.reduce((sum, item) => sum + (item.currentValue ?? 0), 0);

  return {
    totalCash: Number(totalCash.toFixed(2)),
    totalPositionsValue: Number(totalPositionsValue.toFixed(2)),
    totalPortfolioValue: Number((totalCash + totalPositionsValue).toFixed(2)),
    positionsCount: portfolio.positions.length,
  };
}

function compactPortfolioPositions(portfolio: Awaited<ReturnType<typeof getPortfolio>>) {
  return [...portfolio.positions]
    .sort((left, right) => (right.currentValue ?? 0) - (left.currentValue ?? 0))
    .slice(0, 25);
}

function compactCashRows(portfolio: Awaited<ReturnType<typeof getPortfolio>>) {
  return [...portfolio.cash]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 10);
}

function compactDecisionActions(actions: unknown) {
  return (actions as AiDecisionPreviewDto["actions"])
    .slice(0, 5)
    .map((action) => ({
      type: action.type,
      ticker: action.ticker,
      ...(action.instrumentName ? { instrumentName: action.instrumentName } : {}),
      accountId: action.accountId,
      lots: action.lots,
      confidence: action.confidence,
    }));
}

async function buildRecentAiHistory(userId: string) {
  const historyFrom = subtractDays(AI_HISTORY_WINDOW_DAYS);
  const [decisions, executions] = await Promise.all([
    prisma.aiDecision.findMany({
      where: {
        userId,
        createdAt: { gte: historyFrom },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        summary: true,
        actions: true,
        warnings: true,
        approvalNote: true,
        executionMode: true,
        createdAt: true,
      },
    }),
    prisma.tradeExecution.findMany({
      where: {
        userId,
        createdAt: { gte: historyFrom },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        aiDecisionId: true,
        status: true,
        actionType: true,
        instrumentId: true,
        accountId: true,
        lots: true,
        brokerOrderId: true,
        failureReason: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    recentDecisions: decisions.map((decision) => ({
      id: decision.id,
      status: decision.status.toLowerCase(),
      executionMode: decision.executionMode.toLowerCase(),
      summary: decision.summary,
      actions: compactDecisionActions(decision.actions),
      warnings: (decision.warnings as string[]).slice(0, 5),
      ...(decision.approvalNote ? { approvalNote: decision.approvalNote } : {}),
      createdAt: decision.createdAt.toISOString(),
    })),
    recentExecutions: executions.map((execution) => ({
      id: execution.id,
      aiDecisionId: execution.aiDecisionId,
      status: execution.status.toLowerCase(),
      actionType: execution.actionType,
      instrumentId: execution.instrumentId,
      accountId: execution.accountId,
      lots: execution.lots,
      ...(execution.brokerOrderId ? { brokerOrderId: execution.brokerOrderId } : {}),
      ...(execution.failureReason ? { failureReason: execution.failureReason } : {}),
      createdAt: execution.createdAt.toISOString(),
    })),
  };
}

export async function previewAiDecision(token: string, userId: string, accountId?: string): Promise<AiDecisionRecordDto> {
  return previewAiDecisionWithProgress(token, userId, accountId);
}

export async function previewAiDecisionWithProgress(
  token: string,
  userId: string,
  accountId?: string,
  onStage?: (stage: AiPreviewJobStageDto) => Promise<void> | void,
): Promise<AiDecisionRecordDto> {
  await onStage?.("collecting_portfolio");
  const [settings, accounts, portfolio] = await Promise.all([
    getInvestorSettings(userId),
    listAccounts(token),
    getPortfolio(token, accountId),
  ]);

  await onStage?.("analyzing_history");
  const history = await buildRecentAiHistory(userId);

  await onStage?.("building_universe");
  const universe = await buildMultiAssetUniverse(token);
  const selectedUniverse = selectUniverseForRiskProfile(universe, settings.riskProfile);

  await onStage?.("preparing_context");
  const runtimeContext = {
    investor: {
      fullName: settings.fullName,
      primaryGoal: settings.primaryGoal,
      riskProfile: settings.riskProfile,
      executionMode: settings.executionMode,
    },
    constraints: {
      allowedActions: ["buy", "sell", "hold"],
      marginAllowed: false,
      executionMode: settings.executionMode,
    },
    accounts,
    portfolio: {
      accountId: portfolio.accountId,
      metrics: buildPortfolioMetrics(portfolio),
      cash: compactCashRows(portfolio),
      positions: compactPortfolioPositions(portfolio),
    },
    history,
    marketUniverse: selectedUniverse,
  };

  await onStage?.("requesting_ai");
  const responseText = await createJsonChatCompletion([
    {
      role: "system",
      content: [
        baseSystemPrompt,
        commonDecisionPrompt,
        executionPolicyPrompt,
        buildGoalPrompt({ primaryGoal: settings.primaryGoal }),
        strategyOverlays[settings.riskProfile],
        futureIdeasPrompt,
        outputSchemaPrompt,
      ].join("\n\n"),
    },
    {
      role: "user",
      content: `Investor decision context:\n${JSON.stringify(runtimeContext, null, 2)}`,
    },
  ]);

  const parsed = aiDecisionPreviewSchema.parse(JSON.parse(responseText));
  const universeById = new Map(selectedUniverse.map((instrument) => [instrument.instrumentId, instrument]));

  const decision: AiDecisionPreviewDto = {
    ...parsed,
    actions: parsed.actions.map((action) => {
      const instrumentName = action.instrumentName || universeById.get(action.instrumentId)?.name;
      const enrichedAction: AiDecisionPreviewDto["actions"][number] = {
        type: action.type,
        instrumentId: action.instrumentId,
        ticker: action.ticker,
        accountId: action.accountId,
        lots: action.lots,
        confidence: action.confidence,
        thesis: action.thesis,
        portfolioImpact: action.portfolioImpact,
        riskNotes: action.riskNotes,
      };

      if (instrumentName) {
        enrichedAction.instrumentName = instrumentName;
      }

      return enrichedAction;
    }),
    futureBuyIdeas: ensureFutureBuyIdeasCount({
      futureBuyIdeas: parsed.futureBuyIdeas.map((idea) => {
      const instrumentName = idea.instrumentName || universeById.get(idea.instrumentId)?.name;
      const enrichedIdea: AiDecisionPreviewDto["futureBuyIdeas"][number] = {
        instrumentId: idea.instrumentId,
        ticker: idea.ticker,
        accountId: idea.accountId,
        confidence: idea.confidence,
        thesis: idea.thesis,
        trigger: idea.trigger,
        riskNotes: idea.riskNotes,
      };

      if (instrumentName) {
        enrichedIdea.instrumentName = instrumentName;
      }

        return enrichedIdea;
      }),
      selectedUniverse,
      accounts,
      portfolio,
    }),
  };

  await onStage?.("saving_decision");
  return persistAiDecision({
    userId,
    ...(accountId ? { accountId } : {}),
    riskProfile: settings.riskProfile,
    executionMode: settings.executionMode,
    runtimeContext,
    decision,
  });
}
