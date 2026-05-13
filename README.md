# invest-agent

Frontend monorepo bootstrap for the renewed investment diploma project.

## Stack

- React 19 + TypeScript + Vite
- Express + TypeScript
- TanStack Router + TanStack Query
- Zustand
- Custom UI components + Tailwind CSS
- React Hook Form + Zod
- ESLint + Prettier + Husky + lint-staged

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

## Быстрый запуск CMD

Все команды ниже рассчитаны на обычный Windows `cmd`, не на PowerShell.

1. Запустить Docker Desktop:

```cmd
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

2. Дождаться запуска Docker и проверить, что он работает:

```cmd
docker info
```

3. Перейти в директорию проекта:

```cmd
cd C:\Users\valer\diplom
```

4. Установить зависимости, если это первый запуск или папка `node_modules` была удалена:

```cmd
pnpm.cmd install
```

5. Поднять PostgreSQL в Docker:

```cmd
pnpm.cmd db:up
```

6. Применить Prisma-схему и сгенерировать Prisma Client:

```cmd
pnpm.cmd db:push
pnpm.cmd db:generate
```

7. Запустить API в отдельном окне `cmd`:

```cmd
cd C:\Users\valer\diplom
set AI_DAILY_REVIEW_ENABLED=false
pnpm.cmd --filter api dev
```

8. Запустить web в другом отдельном окне `cmd`:

```cmd
cd C:\Users\valer\diplom
pnpm.cmd --filter web dev --host 0.0.0.0
```

Открыть приложение: `http://localhost:5173`.

Проверить API: `http://localhost:3001/health`.

Если проект уже подготовлен, обычно достаточно выполнить в первом `cmd`:

```cmd
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
cd C:\Users\valer\diplom
pnpm.cmd db:up
set AI_DAILY_REVIEW_ENABLED=false
pnpm.cmd --filter api dev
```

И во втором `cmd`:

```cmd
cd C:\Users\valer\diplom
pnpm.cmd --filter web dev --host 0.0.0.0
```

## Backend Env

Create `apps/api/.env` from `apps/api/.env.example` and fill in database and auth secrets. T-Bank tokens are now connected by each user from the application UI and are no longer stored in `.env`.

## PostgreSQL

```bash
pnpm db:up
pnpm db:push
pnpm db:generate
```

The default local connection is `postgresql://postgres:postgres@localhost:5432/invest_agent`.
