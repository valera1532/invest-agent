import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  path: resolve(process.cwd(), ".env"),
  override: true,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ACCESS_TOKEN_SECRET: z.string().min(16, "ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(16, "REFRESH_TOKEN_SECRET is required"),
  TOKEN_ENCRYPTION_KEY: z.string().min(16, "TOKEN_ENCRYPTION_KEY is required"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.string().default("gpt-5.5"),
  OPENAI_PROXY_URL: z.string().url().optional(),
  AI_DAILY_REVIEW_ENABLED: z.coerce.boolean().default(true),
  AI_DAILY_REVIEW_HOUR_UTC: z.coerce.number().int().min(0).max(23).default(8),
  AI_DAILY_REVIEW_MINUTE_UTC: z.coerce.number().int().min(0).max(59).default(0),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  isProduction: parsedEnv.NODE_ENV === "production",
};
