import { env } from "@/config/env";
import { runDailyAiReviewForAllUsers } from "@/services/ai-decision-records.service";

let reviewTimer: NodeJS.Timeout | null = null;
let isRunning = false;
let lastRunKey: string | null = null;

async function tickDailyReviewScheduler() {
  if (isRunning) {
    return;
  }

  const now = new Date();
  const runKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${env.AI_DAILY_REVIEW_HOUR_UTC}-${env.AI_DAILY_REVIEW_MINUTE_UTC}`;
  const shouldRunNow =
    now.getUTCHours() === env.AI_DAILY_REVIEW_HOUR_UTC &&
    now.getUTCMinutes() === env.AI_DAILY_REVIEW_MINUTE_UTC &&
    lastRunKey !== runKey;

  if (!shouldRunNow) {
    return;
  }

  isRunning = true;
  lastRunKey = runKey;

  try {
    const results = await runDailyAiReviewForAllUsers();
    const processed = results.filter((item) => item.status === "processed").length;
    const failed = results.filter((item) => item.status === "failed").length;
    console.log(`[ai-review] Daily review completed. processed=${processed} failed=${failed}`);
  } catch (error) {
    console.error("[ai-review] Daily review scheduler failed", error);
  } finally {
    isRunning = false;
  }
}

export function startAiReviewScheduler() {
  if (!env.AI_DAILY_REVIEW_ENABLED) {
    console.log("[ai-review] Daily scheduler is disabled");
    return;
  }

  if (reviewTimer) {
    return;
  }

  reviewTimer = setInterval(() => {
    void tickDailyReviewScheduler();
  }, 60_000);

  console.log(
    `[ai-review] Daily scheduler started at ${env.AI_DAILY_REVIEW_HOUR_UTC}:${String(env.AI_DAILY_REVIEW_MINUTE_UTC).padStart(2, "0")} UTC`,
  );
}
