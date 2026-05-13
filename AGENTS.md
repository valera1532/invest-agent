# AGENTS.md

## Sources Of Truth

- Communicate with the user in Russian unless they explicitly ask for another language.
- This is a `pnpm@10.18.3` workspace; real packages are `apps/api` and `apps/web`. `packages/*` is configured but currently empty.
- Root scripts are the command source of truth; `.github/workflows` and test configs are absent.
- Root diploma documents and `.log` files are not app entrypoints; application code lives under `apps/*`.

## Commands

- Install with `pnpm install`; on PowerShell, use `pnpm.cmd ...` if script policy blocks `pnpm.ps1`.
- `pnpm dev` runs API and web in parallel but does not start Postgres.
- First local startup: `pnpm db:up`, `pnpm db:push`, `pnpm db:generate`, then `pnpm --filter api dev` and `pnpm --filter web dev -- --host 0.0.0.0`.
- Focused commands: `pnpm --filter api lint|build|dev` and `pnpm --filter web lint|build|dev`; root `pnpm lint`/`pnpm build` run API first, then web.
- Database workflow: `pnpm db:up` starts only the `postgres` service, `pnpm db:push` applies `apps/api/prisma/schema.prisma`, and `pnpm db:generate` regenerates Prisma Client. There are no Prisma migrations yet.
- No `test` script is configured; verify with focused `lint`/`build` plus manual API/UI checks.
- Husky pre-commit runs `pnpm exec lint-staged`; lint-staged auto-fixes `apps/web/src/**/*.{ts,tsx,css}` and root `*.{json,md,html}`, not API TypeScript.

## Environment

- API env lives in `apps/api/.env`, copied from `apps/api/.env.example`; T-Bank user tokens are connected in the UI and must not be added to `.env`.
- `apps/api/src/config/env.ts` loads `.env` from `process.cwd()`, so run API/Prisma through `pnpm --filter api ...` or from `apps/api`, not by launching `apps/api/src/index.ts` from repo root.
- Defaults: API `http://localhost:3001`, web `http://localhost:5173`, Postgres `postgresql://postgres:postgres@localhost:5432/invest_agent`.
- Web API calls use `apiClient` with `withCredentials`; `VITE_API_URL` is optional because Vite proxies `/api` and `/health` to the API in dev.
- API startup enables the AI daily review scheduler by default; set `AI_DAILY_REVIEW_ENABLED=false` locally when scheduled AI/trading work must not run.

## Architecture

- API entrypoint is `apps/api/src/index.ts`; `createApp()` wires `/`, `/health`, `/api/auth`, then authenticated `/api/*` routes. Keep the `routes -> controllers -> services` split, with Zod request schemas in `src/schemas`.
- API uses CommonJS output plus a custom `@/` runtime alias in `src/lib/path-alias-register.ts`; import that register file before aliased imports in any new runtime entrypoint.
- Web entrypoint is `apps/web/src/main.tsx`; TanStack Router is defined manually in `src/app/router.tsx`. `/app` is gated by auth, T-Bank token connection, then investor quiz completion.
- API contracts are manually duplicated in web `features/*/api/*.ts`; update backend schemas/controllers and frontend types/callers together.
- Current UI primitives are custom `components/ui` with CVA/Tailwind/Radix Slot; README's Ant Design mention is stale and `antd` is not installed.
- Tailwind is v4 via `@tailwindcss/vite` and `@import "tailwindcss"` in `index.css`; there is no Tailwind config file.

## Domain Gotchas

- T-Bank tokens are encrypted in `TbankConnection`; never log raw tokens or commit env files.
- AI prompts and provider access live only on the backend under `apps/api/src/ai` and `services/ai-*`; frontend should call API endpoints, not OpenAI directly.
- AI preview parses model JSON with `aiDecisionPreviewSchema` and persists an `AiDecision`; preview paths and preview jobs must not place broker orders.
- Preview jobs run in-process via `void processAiPreviewJob(...)`; there is no external queue or worker.
- Approving an AI decision executes it immediately because `approveAiDecision` calls `executeAiDecision`; status-only approval is not current behavior.
- Broker orders go through `placeMarketOrder` and should record `TradeExecution` success/failure with broker response or failure reason.
