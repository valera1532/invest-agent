import { z } from "zod";

export const aiDecisionPreviewRequestSchema = z.object({
  accountId: z.string().min(1).optional(),
});

export const aiDecisionParamsSchema = z.object({
  id: z.string().min(1),
});

export const aiPreviewJobParamsSchema = z.object({
  id: z.string().min(1),
});

export const aiDecisionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const aiDecisionApprovalSchema = z.object({
  note: z.string().trim().max(300).optional(),
});

export const aiDecisionActionSchema = z.object({
  type: z.enum(["buy", "sell", "hold"]),
  instrumentId: z.string().min(1),
  ticker: z.string().min(1),
  instrumentName: z.string().min(1).optional(),
  accountId: z.string().min(1),
  lots: z.number().int().positive(),
  confidence: z.number().min(0).max(1),
  thesis: z.string().min(1),
  portfolioImpact: z.string().min(1),
  riskNotes: z.array(z.string()).default([]),
});

export const aiFutureBuyIdeaSchema = z.object({
  instrumentId: z.string().min(1),
  ticker: z.string().min(1),
  instrumentName: z.string().min(1).optional(),
  accountId: z.string().min(1),
  confidence: z.number().min(0).max(1),
  thesis: z.string().min(1),
  trigger: z.string().min(1),
  riskNotes: z.array(z.string()).default([]),
});

export const aiDecisionPreviewSchema = z.object({
  summary: z.string().min(1),
  portfolioView: z.object({
    riskAlignment: z.enum(["aligned", "partially_aligned", "misaligned"]),
    cashStatus: z.enum(["underinvested", "balanced", "overexposed"]),
    diversificationStatus: z.enum(["weak", "moderate", "strong"]),
    portfolioAssessment: z.string().min(1),
  }),
  actions: z.array(aiDecisionActionSchema),
  futureBuyIdeas: z.array(aiFutureBuyIdeaSchema).max(10),
  warnings: z.array(z.string()),
  rejectedIdeas: z.array(z.string()),
});

export const aiDecisionStatusSchema = z.enum([
  "proposed",
  "approved",
  "rejected",
  "executed",
  "failed",
]);

export const aiPreviewJobStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

export const aiPreviewJobStageSchema = z.enum([
  "collecting_portfolio",
  "analyzing_history",
  "building_universe",
  "preparing_context",
  "requesting_ai",
  "saving_decision",
]);

export const aiDecisionRecordSchema = aiDecisionPreviewSchema.extend({
  id: z.string().min(1),
  accountId: z.string().min(1).optional(),
  status: aiDecisionStatusSchema,
  executionMode: z.enum(["manual_approval", "full_auto"]),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  approvalNote: z.string().min(1).optional(),
});

export const aiPreviewJobSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1).optional(),
  status: aiPreviewJobStatusSchema,
  stage: aiPreviewJobStageSchema.optional(),
  errorMessage: z.string().min(1).optional(),
  decisionId: z.string().min(1).optional(),
  decision: aiDecisionRecordSchema.optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  startedAt: z.string().min(1).optional(),
  finishedAt: z.string().min(1).optional(),
});

export type AiDecisionPreviewInput = z.infer<typeof aiDecisionPreviewRequestSchema>;
