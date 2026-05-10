import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  PanelLeft,
  Settings2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser, logoutUser } from "@/features/auth/api/auth";
import { useUiStore } from "@/store/ui-store";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/app/overview": {
    title: "Обзор кабинета",
    subtitle: "Ключевые метрики, активы и структура пользовательских счетов.",
  },
  "/app/stocks": {
    title: "Акции",
    subtitle:
      "Текущие бумаги, поиск доступных инструментов и покупка на брокерский счет.",
  },
  "/app/portfolio": {
    title: "Портфель",
    subtitle:
      "Реальные позиции, остатки и распределение по всем доступным счетам.",
  },
  "/app/ai": {
    title: "AI-аналитик",
    subtitle:
      "Preview решений AI по multi-asset портфелю без автоматического исполнения.",
  },
  "/app/investor-quiz": {
    title: "Инвест-квиз",
    subtitle:
      "Подбираем рекомендуемую стратегию портфеля и частоту AI-review по вашему профилю.",
  },
  "/app/settings": {
    title: "Настройки",
    subtitle: "Локальные предпочтения кабинета и режим работы пользователя.",
  },
};

export function AppShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: getCurrentUser,
    retry: false,
  });
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      queryClient.setQueryData(["auth-me"], null);
      toast.success("Ты вышел из аккаунта");
      navigate({ to: "/auth/login" });
    },
  });

  const navigationItems = useMemo(
    () => [
      { href: "/app/overview", label: "Обзор", icon: Home },
      { href: "/app/stocks", label: "Акции", icon: BarChart3 },
      { href: "/app/portfolio", label: "Портфель", icon: Wallet },
      { href: "/app/ai", label: "AI", icon: Bot },
      { href: "/app/settings", label: "Настройки", icon: Settings2 },
    ],
    [],
  );

  const meta = pageMeta[pathname] ?? pageMeta["/app/overview"];

  const navContent = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#133129_0%,#0e2620_100%)] text-white">
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <BrandMark size={40} />
          {!sidebarCollapsed && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                shadcn redesign
              </div>
              <div className="text-base font-semibold text-white">
                Invest Agent
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                  sidebarCollapsed && "justify-center px-0",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed ? <span>{item.label}</span> : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        {!sidebarCollapsed ? (
          <div className="mb-4 rounded-3xl border border-white/10 bg-white/8 px-4 py-4">
            <div className="text-sm font-semibold text-white">
              {meQuery.data?.name ?? "Пользователь"}
            </div>
            <div className="mt-1 text-sm text-white/55">
              {meQuery.data?.email ?? "Аккаунт не загружен"}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className={cn(
              "w-full justify-start text-white hover:bg-white/8 hover:text-white",
              sidebarCollapsed && "justify-center px-0",
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            {!sidebarCollapsed ? "Свернуть" : null}
          </Button>

          <Button
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            loading={logoutMutation.isPending}
            className={cn(
              "w-full justify-start text-white hover:bg-white/8 hover:text-white",
              sidebarCollapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed ? "Выйти" : null}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-screen flex bg-transparent">
      <aside
        className={cn(
          "hidden h-full border-r border-white/8 lg:block",
          sidebarCollapsed ? "w-24" : "w-72",
        )}
      >
        {navContent}
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#071410]/60"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative h-full w-72 max-w-[85vw]">{navContent}</div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[linear-gradient(135deg,#17362f_0%,#21463d_52%,#1a3b33_100%)] px-4 text-white md:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold leading-none md:text-[26px]">
                {meta.title}
              </h1>
              <p className="mt-1 text-sm text-white/70">{meta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {meQuery.data ? (
              <div className="hidden rounded-full border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
                <div className="text-sm font-semibold text-white">
                  {meQuery.data.name}
                </div>
                <div className="text-xs text-white/60">
                  {meQuery.data.email}
                </div>
              </div>
            ) : null}

            <Button
              asChild
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/">На лендинг</Link>
            </Button>
          </div>
        </header>

        <main className="app-scrollbar flex min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto flex min-h-full w-full max-w-7xl flex-1 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
