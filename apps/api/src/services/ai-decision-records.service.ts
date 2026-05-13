import { AiDecisionStatus, AiExecutionMode, AiReviewFrequency, Prisma, RiskProfile, TradeExecutionStatus } from "@prisma/client";
import { HttpError } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { getUserTbankToken } from "@/services/tbank-connection.service";
import { placeMarketOrder } from "@/services/trading.service";
import type { AiDecisionPreviewDto, AiDecisionRecordDto, AiDecisionListDto, AiTradeExecutionDto } from "@/types/ai";

type PersistAiDecisionInput = {
  userId: string;
  accountId?: string;
  riskProfile: "conservative" | "balanced" | "growth" | "aggressive";
  executionMode: "manual_approval" | "full_auto";
  runtimeContext: unknown;
  decision: AiDecisionPreviewDto;
};

function mapRiskProfileToDb(value: PersistAiDecisionInput["riskProfile"]): RiskProfile {
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

function mapExecutionModeToDb(value: PersistAiDecisionInput["executionMode"]): AiExecutionMode {
  switch (value) {
    case "manual_approval":
      return AiExecutionMode.MANUAL_APPROVAL;
    case "full_auto":
      return AiExecutionMode.FULL_AUTO;
  }
}

function mapDecisionStatusToDto(value: AiDecisionStatus): AiDecisionRecordDto["status"] {
  switch (value) {
    case AiDecisionStatus.PROPOSED:
      return "proposed";
    case AiDecisionStatus.APPROVED:
      return "approved";
    case AiDecisionStatus.REJECTED:
      return "rejected";
    case AiDecisionStatus.EXECUTED:
      return "executed";
    case AiDecisionStatus.FAILED:
      return "failed";
  }
}

function mapTradeExecutionStatusToDto(value: TradeExecutionStatus): AiTradeExecutionDto["status"] {
  switch (value) {
    case TradeExecutionStatus.PENDING:
      return "pending";
    case TradeExecutionStatus.SUCCESS:
      return "success";
    case TradeExecutionStatus.FAILED:
      return "failed";
    case TradeExecutionStatus.CANCELLED:
      return "cancelled";
  }
}

function mapExecutionModeToDto(value: AiExecutionMode): AiDecisionRecordDto["executionMode"] {
  switch (value) {
    case AiExecutionMode.MANUAL_APPROVAL:
      return "manual_approval";
    case AiExecutionMode.FULL_AUTO:
      return "full_auto";
  }
}

function toAiDecisionRecordDto(record: {
  id: string;
  accountId: string | null;
  status: AiDecisionStatus;
  executionMode: AiExecutionMode;
  summary: string;
  portfolioView: unknown;
  actions: unknown;
  futureBuyIdeas: unknown;
  warnings: unknown;
  rejectedIdeas: unknown;
  createdAt: Date;
  updatedAt: Date;
  approvalNote: string | null;
  tradeExecutions?: Array<{
    id: string;
    status: TradeExecutionStatus;
    actionType: string;
    instrumentId: string;
    accountId: string;
    lots: number;
    brokerOrderId: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): AiDecisionRecordDto {
  const tradeExecutions = record.tradeExecutions?.map((execution) => ({
    id: execution.id,
    status: mapTradeExecutionStatusToDto(execution.status),
    actionType: execution.actionType,
    instrumentId: execution.instrumentId,
    accountId: execution.accountId,
    lots: execution.lots,
    ...(execution.brokerOrderId ? { brokerOrderId: execution.brokerOrderId } : {}),
    ...(execution.failureReason ? { failureReason: execution.failureReason } : {}),
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
  }));

  return {
    id: record.id,
    ...(record.accountId ? { accountId: record.accountId } : {}),
    status: mapDecisionStatusToDto(record.status),
    executionMode: mapExecutionModeToDto(record.executionMode),
    summary: record.summary,
    portfolioView: record.portfolioView as AiDecisionRecordDto["portfolioView"],
    actions: record.actions as AiDecisionRecordDto["actions"],
    futureBuyIdeas: (record.futureBuyIdeas as AiDecisionRecordDto["futureBuyIdeas"] | null) ?? [],
    warnings: record.warnings as string[],
    rejectedIdeas: record.rejectedIdeas as string[],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    ...(record.approvalNote ? { approvalNote: record.approvalNote } : {}),
    ...(tradeExecutions ? { tradeExecutions } : {}),
  };
}

export async function persistAiDecision(input: PersistAiDecisionInput): Promise<AiDecisionRecordDto> {
  const runtimeContext = input.runtimeContext as Prisma.InputJsonValue;
  const created = await prisma.aiDecision.create({
    data: {
      userId: input.userId,
      ...(input.accountId ? { accountId: input.accountId } : {}),
      riskProfile: mapRiskProfileToDb(input.riskProfile),
      executionMode: mapExecutionModeToDb(input.executionMode),
      summary: input.decision.summary,
      portfolioView: input.decision.portfolioView,
      actions: input.decision.actions,
      futureBuyIdeas: input.decision.futureBuyIdeas,
      warnings: input.decision.warnings,
      rejectedIdeas: input.decision.rejectedIdeas,
      runtimeContext,
    },
  });

  return toAiDecisionRecordDto(created);
}

export async function listAiDecisions(userId: string, page = 1, limit = 20): Promise<AiDecisionListDto> {
  const safeLimit = Math.min(limit, 50);
  const safePage = Math.max(page, 1);
  const [total, records] = await Promise.all([
    prisma.aiDecision.count({ where: { userId } }),
    prisma.aiDecision.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: {
        tradeExecutions: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    items: records.map(toAiDecisionRecordDto),
    page: Math.min(safePage, totalPages),
    limit: safeLimit,
    total,
    totalPages,
  };
}

async function getOwnedDecision(userId: string, id: string) {
  const record = await prisma.aiDecision.findFirst({
    where: { id, userId },
    include: {
      tradeExecutions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!record) {
    throw new HttpError(404, "AI decision not found");
  }

  return record;
}

export async function getAiDecisionRecordById(userId: string, id: string): Promise<AiDecisionRecordDto> {
  const record = await getOwnedDecision(userId, id);
  return toAiDecisionRecordDto(record);
}

type ActionRecord = AiDecisionRecordDto["actions"][number];

function normalizeActions(actions: unknown): ActionRecord[] {
  return actions as ActionRecord[];
}

function normalizeJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function executeAiDecision(userId: string, id: string) {
  const record = await getOwnedDecision(userId, id);
  if (record.status !== AiDecisionStatus.APPROVED && record.status !== AiDecisionStatus.PROPOSED) {
    throw new HttpError(400, "Only proposed or approved AI decisions can be executed");
  }

  const token = await getUserTbankToken(userId);
  const actions = normalizeActions(record.actions).filter((action) => action.type === "buy" || action.type === "sell");

  if (!actions.length) {
    const updated = await prisma.aiDecision.update({
      where: { id },
      data: { status: AiDecisionStatus.EXECUTED },
    });

    return toAiDecisionRecordDto(updated);
  }

  let hasFailures = false;

  for (const action of actions) {
    const execution = await prisma.tradeExecution.create({
      data: {
        aiDecisionId: record.id,
        userId,
        actionType: action.type,
        instrumentId: action.instrumentId,
        accountId: action.accountId,
        lots: action.lots,
      },
    });

    try {
      const result = await placeMarketOrder(token, {
        accountId: action.accountId,
        instrumentId: action.instrumentId,
        quantity: action.lots,
        direction: action.type === "buy" ? 1 : 2,
      });

      await prisma.tradeExecution.update({
        where: { id: execution.id },
        data: {
          status: TradeExecutionStatus.SUCCESS,
          brokerOrderId: result.orderId,
          brokerResponse: normalizeJson(result.rawResponse),
        },
      });
    } catch (error) {
      hasFailures = true;
      const failureReason = error instanceof Error ? error.message : "Trade execution failed";

      await prisma.tradeExecution.update({
        where: { id: execution.id },
        data: {
          status: TradeExecutionStatus.FAILED,
          failureReason,
        },
      });

      break;
    }
  }

  const updated = await prisma.aiDecision.update({
    where: { id },
    data: {
      status: hasFailures ? AiDecisionStatus.FAILED : AiDecisionStatus.EXECUTED,
    },
  });

  void updated;
  return getAiDecisionRecordById(userId, id);
}

export async function approveAiDecision(userId: string, id: string, note?: string) {
  const record = await getOwnedDecision(userId, id);
  if (record.status !== AiDecisionStatus.PROPOSED) {
    throw new HttpError(400, "Only proposed AI decisions can be approved");
  }

  const updated = await prisma.aiDecision.update({
    where: { id },
    data: {
      status: AiDecisionStatus.APPROVED,
      ...(note ? { approvalNote: note } : {}),
    },
  });

  return executeAiDecision(userId, updated.id);
}

export async function rejectAiDecision(userId: string, id: string, note?: string) {
  const record = await getOwnedDecision(userId, id);
  if (record.status !== AiDecisionStatus.PROPOSED) {
    throw new HttpError(400, "Only proposed AI decisions can be rejected");
  }

  const updated = await prisma.aiDecision.update({
    where: { id },
    data: {
      status: AiDecisionStatus.REJECTED,
      ...(note ? { approvalNote: note } : {}),
    },
  });

  return toAiDecisionRecordDto(updated);
}

export async function runDailyAiReviewForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      investorProfile: true,
      tbankConnection: true,
      aiDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user?.investorProfile || !user.tbankConnection) {
    return null;
  }

  const lastDecision = user.aiDecisions[0];
  const now = new Date();
  if (lastDecision && lastDecision.createdAt.toDateString() === now.toDateString()) {
    return null;
  }

  const reviewFrequency = user.investorProfile.aiReviewFrequency ?? AiReviewFrequency.DAILY;
  if (lastDecision && reviewFrequency === AiReviewFrequency.WEEKLY) {
    const diffMs = now.getTime() - lastDecision.createdAt.getTime();
    if (diffMs < 7 * 24 * 60 * 60 * 1000) {
      return null;
    }
  }
  if (lastDecision && reviewFrequency === AiReviewFrequency.MONTHLY) {
    const diffMs = now.getTime() - lastDecision.createdAt.getTime();
    if (diffMs < 30 * 24 * 60 * 60 * 1000) {
      return null;
    }
  }

  const { previewAiDecision } = await import("@/services/ai-decision.service");
  const decision = await previewAiDecision(await getUserTbankToken(userId), userId);

  if (user.investorProfile.executionMode === AiExecutionMode.FULL_AUTO) {
    return executeAiDecision(userId, decision.id);
  }

  return decision;
}

export async function runDailyAiReviewForAllUsers() {
  const users = await prisma.user.findMany({
    where: {
      investorProfile: { isNot: null },
      tbankConnection: { isNot: null },
    },
    select: { id: true },
  });

  const results = [] as Array<{ userId: string; status: "processed" | "skipped" | "failed" }>;

  for (const user of users) {
    try {
      const result = await runDailyAiReviewForUser(user.id);
      results.push({ userId: user.id, status: result ? "processed" : "skipped" });
    } catch {
      results.push({ userId: user.id, status: "failed" });
    }
  }

  return results;
}
