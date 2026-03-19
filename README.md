# invest-agent

Frontend monorepo bootstrap for the renewed investment diploma project.

## Stack

- React 19 + TypeScript + Vite
- Express + TypeScript
- TanStack Router + TanStack Query
- Zustand
- Ant Design + Tailwind CSS
- React Hook Form + Zod
- ESLint + Prettier + Husky + lint-staged

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

## Windows Quick Start

```powershell
cd C:\Users\valer\diplom
pnpm.cmd install
pnpm.cmd dev
```

Frontend opens at `http://localhost:5173`.
API runs at `http://localhost:3001`.

If PowerShell blocks `pnpm.ps1`, use `pnpm.cmd` instead of `pnpm`.

## Backend Env

Create `apps/api/.env` from `apps/api/.env.example` and fill in `TINKOFF_TOKEN` before calling Tinkoff endpoints.
