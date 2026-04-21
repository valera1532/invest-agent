import type { Request, Response } from "express";
import { HttpError } from "@/lib/http-error";
import {
  aiDecisionApprovalSchema,
  aiDecisionListQuerySchema,
  aiDecisionParamsSchema,
  aiPreviewJobParamsSchema,
  aiDecisionPreviewRequestSchema,
} from "@/schemas/ai.schemas";
import {
  approveAiDecision,
  executeAiDecision,
  listAiDecisions,
  rejectAiDecision,
  runDailyAiReviewForAllUsers,
} from "@/services/ai-decision-records.service";
import { previewAiDecision } from "@/services/ai-decision.service";
import { createAiPreviewJob, getAiPreviewJob } from "@/services/ai-preview-jobs.service";
import { getUserTbankToken } from "@/services/tbank-connection.service";

export async function previewAiDecisionController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const { accountId } = aiDecisionPreviewRequestSchema.parse(request.body ?? {});
  const token = await getUserTbankToken(userId);
  const decision = await previewAiDecision(token, userId, accountId);
  response.json(decision);
}

export async function createAiPreviewJobController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const { accountId } = aiDecisionPreviewRequestSchema.parse(request.body ?? {});
  const job = await createAiPreviewJob(userId, accountId);
  response.status(202).json(job);
}

export async function getAiPreviewJobController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const { id } = aiPreviewJobParamsSchema.parse(request.params);
  const job = await getAiPreviewJob(userId, id);
  response.json(job);
}

export async function listAiDecisionsController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const { page, limit } = aiDecisionListQuerySchema.parse(request.query);
  const decisions = await listAiDecisions(userId, page, limit);
  response.json(decisions);
}

export async function approveAiDecisionController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const { id } = aiDecisionParamsSchema.parse(request.params);
  const { note } = aiDecisionApprovalSchema.parse(request.body ?? {});
  const decision = await approveAiDecision(userId, id, note);
  response.json(decision);
}

export async function rejectAiDecisionController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const { id } = aiDecisionParamsSchema.parse(request.params);
  const { note } = aiDecisionApprovalSchema.parse(request.body ?? {});
  const decision = await rejectAiDecision(userId, id, note);
  response.json(decision);
}

export async function executeAiDecisionController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const { id } = aiDecisionParamsSchema.parse(request.params);
  const decision = await executeAiDecision(userId, id);
  response.json(decision);
}

export async function runDailyAiReviewController(request: Request, response: Response) {
  const userId = request.authUser?.id;
  if (!userId) {
    throw new HttpError(401, "Authentication required");
  }

  const results = await runDailyAiReviewForAllUsers();
  response.json({ ok: true, results });
}
