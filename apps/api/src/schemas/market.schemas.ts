import { z } from "zod";

export const sharesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const portfolioQuerySchema = z.object({
  accountId: z.string().min(1).optional(),
});

export const accountParamsSchema = z.object({
  id: z.string().min(1),
});
