import { z } from "zod";

export const sharesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const shareSearchQuerySchema = z.object({
  query: z.string().trim().min(2).max(50),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const portfolioQuerySchema = z.object({
  accountId: z.string().min(1).optional(),
});

export const accountParamsSchema = z.object({
  id: z.string().min(1),
});

export const buyShareSchema = z.object({
  accountId: z.string().min(1),
  instrumentId: z.string().min(1),
  quantity: z.coerce.number().int().positive().max(1_000),
});
