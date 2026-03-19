import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Typography } from "antd";
import { NotFoundPage, RootComponent } from "./router-views";
import { AppShell } from "@/components/app-shell";
import { DashboardPage } from "@/pages/dashboard-page";
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
  component: AppShell,
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

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  appRoute.addChildren([
    appIndexRoute,
    overviewRoute,
    marketsRoute,
    stocksRoute,
    portfolioRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Typography.Text type="secondary">Загружаем интерфейс...</Typography.Text>
    </div>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
