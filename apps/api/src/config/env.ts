import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  path: resolve(process.cwd(), ".env"),
  override: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  TINKOFF_TOKEN: z.string().optional().default(""),
  TINKOFF_USE_SANDBOX: z.string().optional().default("false"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  isProduction: parsedEnv.NODE_ENV === "production",
  tinkoffSandbox:
    parsedEnv.TINKOFF_USE_SANDBOX.toLowerCase() === "true" || parsedEnv.TINKOFF_USE_SANDBOX === "1",
};
