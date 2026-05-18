import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { NotFoundPage, RootComponent } from "./router-views";
import { ConnectTokenGuard } from "@/features/auth/components/connect-token-guard";
import { GuestOnly } from "@/features/auth/components/guest-only";
import { ProtectedApp } from "@/features/auth/components/protected-app";
import { AuthLoginPage } from "@/pages/auth-login-page";
import { AuthRegisterPage } from "@/pages/auth-register-page";
import { AnalysisPage } from "@/pages/analysis-page";
import { ConnectTokenPage } from "@/pages/connect-token-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { AiPage } from "@/pages/ai-page";
import { InvestorQuizPage } from "@/pages/investor-quiz-page";
import { LandingPage } from "@/pages/landing-page";
import { PortfolioPage } from "@/pages/portfolio-page";
import { SettingsPage } from "@/pages/settings-page";
import { StocksPage } from "@/pages/stocks-page";

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: ProtectedApp,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: GuestOnly,
});

const connectTokenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/connect-token",
  component: ConnectTokenGuard,
});

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "login",
  component: AuthLoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "register",
  component: AuthRegisterPage,
});

const connectTokenIndexRoute = createRoute({
  getParentRoute: () => connectTokenRoute,
  path: "/",
  component: ConnectTokenPage,
});

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/app/overview" });
  },
});

const overviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "overview",
  component: DashboardPage,
});

const marketsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "markets",
  beforeLoad: () => {
    throw redirect({ to: "/app/stocks" });
  },
});

const stocksRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "stocks",
  component: StocksPage,
});

const portfolioRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "portfolio",
  component: PortfolioPage,
});

const analysisRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "analysis",
  component: AnalysisPage,
});

const investorQuizRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "investor-quiz",
  component: InvestorQuizPage,
});

const aiRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "ai",
  component: AiPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  authRoute.addChildren([loginRoute, registerRoute]),
  connectTokenRoute.addChildren([connectTokenIndexRoute]),
  appRoute.addChildren([
    appIndexRoute,
    overviewRoute,
    marketsRoute,
    stocksRoute,
    portfolioRoute,
    analysisRoute,
    investorQuizRoute,
    aiRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[#60716a]">Загружаем интерфейс...</p>
    </div>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
