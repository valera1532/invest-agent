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

## Windows CMD Quick Start

All commands below are intended for the regular Windows `cmd` terminal.

1. Start Docker Desktop and wait until Docker is running.
2. Open `cmd` in the project folder:

```cmd
cd C:\Users\valer\diplom
```

3. Install dependencies, if this is the first launch:

```cmd
pnpm.cmd install
```

4. Start PostgreSQL in Docker:

```cmd
pnpm.cmd db:up
```

5. Apply the Prisma schema and generate Prisma Client:

```cmd
pnpm.cmd db:push
pnpm.cmd db:generate
```

6. Start the API in a separate `cmd` window:

```cmd
cd C:\Users\valer\diplom
set AI_DAILY_REVIEW_ENABLED=false&& pnpm.cmd --filter api dev
```

7. Start the frontend in another separate `cmd` window:

```cmd
cd C:\Users\valer\diplom
pnpm.cmd --filter web dev --host 0.0.0.0
```

Frontend opens at `http://localhost:5173`.
API runs at `http://localhost:3001`.
API health check is available at `http://localhost:3001/health`.

For later launches, if dependencies and Prisma are already prepared, usually only steps 1, 4, 6, and 7 are needed.

## Backend Env

Create `apps/api/.env` from `apps/api/.env.example` and fill in database and auth secrets. T-Bank tokens are now connected by each user from the application UI and are no longer stored in `.env`.

## PostgreSQL

```bash
pnpm db:up
pnpm db:push
pnpm db:generate
```

The default local connection is `postgresql://postgres:postgres@localhost:5432/invest_agent`.
