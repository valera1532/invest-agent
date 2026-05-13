import { AiPreviewJobStatus } from "@prisma/client";
import { HttpError } from "@/lib/http-error";
import { prisma } from "@/lib/prisma";
import { previewAiDecisionWithProgress } from "@/services/ai-decision.service";
import { getUserTbankToken } from "@/services/tbank-connection.service";
import type { AiDecisionRecordDto, AiPreviewJobDto, AiPreviewJobStageDto } from "@/types/ai";

function mapStatus(value: AiPreviewJobStatus): AiPreviewJobDto["status"] {
  switch (value) {
    case AiPreviewJobStatus.QUEUED:
      return "queued";
    case AiPreviewJobStatus.RUNNING:
      return "running";
    case AiPreviewJobStatus.COMPLETED:
      return "completed";
    case AiPreviewJobStatus.FAILED:
      return "failed";
  }
}

function toJobDto(record: {
  id: string;
  accountId: string | null;
  status: AiPreviewJobStatus;
  stage: string | null;
  errorMessage: string | null;
  decisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  decision?: AiDecisionRecordDto | null;
}): AiPreviewJobDto {
  return {
    id: record.id,
    ...(record.accountId ? { accountId: record.accountId } : {}),
    status: mapStatus(record.status),
    ...(record.stage ? { stage: record.stage as AiPreviewJobStageDto } : {}),
    ...(record.errorMessage ? { errorMessage: record.errorMessage } : {}),
    ...(record.decisionId ? { decisionId: record.decisionId } : {}),
    ...(record.decision ? { decision: record.decision } : {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    ...(record.startedAt ? { startedAt: record.startedAt.toISOString() } : {}),
    ...(record.finishedAt ? { finishedAt: record.finishedAt.toISOString() } : {}),
  };
}

export async function createAiPreviewJob(userId: string, accountId?: string) {
  const job = await prisma.aiPreviewJob.create({
    data: {
      userId,
      ...(accountId ? { accountId } : {}),
    },
  });

  void processAiPreviewJob(job.id);
  return toJobDto(job);
}

export async function getAiPreviewJob(userId: string, id: string): Promise<AiPreviewJobDto> {
  const job = await prisma.aiPreviewJob.findFirst({
    where: { id, userId },
  });

  if (!job) {
    throw new HttpError(404, "AI preview job not found");
  }

  let decision: AiDecisionRecordDto | null = null;
  if (job.decisionId) {
    const { getAiDecisionRecordById } = await import("@/services/ai-decision-records.service");
    decision = await getAiDecisionRecordById(userId, job.decisionId);
  }

  return toJobDto({ ...job, decision });
}

async function setJobRunning(id: string, stage: AiPreviewJobStageDto) {
  await prisma.aiPreviewJob.update({
    where: { id },
    data: {
      status: AiPreviewJobStatus.RUNNING,
      stage,
      startedAt: new Date(),
      errorMessage: null,
    },
  });
}

async function setJobStage(id: string, stage: AiPreviewJobStageDto) {
  await prisma.aiPreviewJob.update({
    where: { id },
    data: { stage },
  });
}

async function setJobCompleted(id: string, decisionId: string) {
  await prisma.aiPreviewJob.update({
    where: { id },
    data: {
      status: AiPreviewJobStatus.COMPLETED,
      decisionId,
      finishedAt: new Date(),
    },
  });
}

async function setJobFailed(id: string, errorMessage: string) {
  await prisma.aiPreviewJob.update({
    where: { id },
    data: {
      status: AiPreviewJobStatus.FAILED,
      errorMessage,
      finishedAt: new Date(),
    },
  });
}

function formatJobError(error: unknown) {
  if (error instanceof HttpError) {
    const details = typeof error.details === "string" ? error.details : JSON.stringify(error.details);
    return details ? `${error.message}: ${details.slice(0, 1000)}` : error.message;
  }

  if (error instanceof Error) {
    return error.name === "AbortError" ? "OpenAI request timed out" : error.message;
  }

  return "AI preview job failed";
}

export async function processAiPreviewJob(id: string) {
  const job = await prisma.aiPreviewJob.findUnique({ where: { id } });
  if (!job) {
    return;
  }

  try {
    await setJobRunning(id, "collecting_portfolio");
    const token = await getUserTbankToken(job.userId);
    const decision = await previewAiDecisionWithProgress(token, job.userId, job.accountId ?? undefined, async (stage) => {
      await setJobStage(id, stage);
    });
    await setJobCompleted(id, decision.id);
  } catch (error) {
    await setJobFailed(id, formatJobError(error));
  }
}
