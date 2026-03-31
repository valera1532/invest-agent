# Agent Rules

- Keep the project as a `pnpm` monorepo.
- Build the frontend in `apps/web` with React 19, Vite, TypeScript, Ant Design, Tailwind, TanStack Router, TanStack Query, Zustand, React Hook Form, and Zod.
- Build the backend in `apps/api` with Express, TypeScript, Zod, and a layered structure (`controllers`, `services`, `integrations`, `routes`).
- Use `Ant Design` for core UI components and `Tailwind` for layout and responsive composition.
- Prefer feature-oriented folders and keep shared logic inside `src/shared` or `src/store`.
- Preserve a clean layered structure so the future API can connect without major frontend rewrites.
- Use production-grade names for variables, functions, and clients; avoid temporary names like `backendAxiosClient` in final code.
- Never use `!important` or Tailwind important modifiers in project code.
- Avoid inline `style` props in app code; prefer Tailwind classes or CSS files, and use inline styles only when there is no practical alternative.
- Validate important changes with `pnpm lint` and `pnpm build`.
