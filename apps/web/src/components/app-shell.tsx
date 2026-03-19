import { useMemo, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PieChartOutlined,
  RocketOutlined,
  StockOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Space,
  Tag,
  Typography,
} from "antd";
import { useUiStore } from "@/store/ui-store";

const { Header, Sider, Content } = Layout;

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/app/overview": {
    title: "Обзор кабинета",
    subtitle:
      "Ключевые метрики, активность портфеля и точки внимания за сегодня.",
  },
  "/app/stocks": {
    title: "Акции",
    subtitle:
      "Котировки, компании и срез по бумагам, которые приходят с backend T-API.",
  },
  "/app/portfolio": {
    title: "Портфель",
    subtitle: "Структура капитала, распределение и контроль по счетам.",
  },
  "/app/settings": {
    title: "Настройки",
    subtitle: "Профиль пользователя, предпочтения и параметры рабочего места.",
  },
};

export function AppShell() {
  const screens = Grid.useBreakpoint();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isMobile = !screens.lg;
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const items = useMemo(
    () => [
      {
        key: "/app/overview",
        icon: <RocketOutlined />,
        label: <Link to="/app/overview">Обзор</Link>,
      },
      {
        key: "/app/stocks",
        icon: <StockOutlined />,
        label: <Link to="/app/stocks">Акции</Link>,
      },
      {
        key: "/app/portfolio",
        icon: <PieChartOutlined />,
        label: <Link to="/app/portfolio">Портфель</Link>,
      },
      {
        key: "/app/settings",
        icon: <SettingOutlined />,
        label: <Link to="/app/settings">Настройки</Link>,
      },
    ],
    [],
  );

  const meta = pageMeta[pathname] ?? pageMeta["/app/overview"];
  const selectedKey = items.some((item) => pathname.startsWith(item.key))
    ? items.find((item) => pathname.startsWith(item.key))?.key
    : "/app/overview";

  const menuNode = (
    <div className="flex h-full flex-col bg-[#133129] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Typography.Text className="block text-[11px] uppercase tracking-[0.32em] text-white/60">
          Invest Agent
        </Typography.Text>
        <Typography.Title level={4} className="!mb-0 !mt-2 !text-white">
          Личный кабинет
        </Typography.Title>
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={items}
        onClick={() => setDrawerOpen(false)}
        theme="dark"
        className="flex-1 border-0 bg-transparent px-3 pt-4"
      />
      <div className="m-4 rounded-3xl border border-white/10 bg-white/10 p-4 text-white/80 backdrop-blur-sm">
        <div className="text-xs uppercase tracking-[0.24em] text-white/50">
          build
        </div>
        <div className="mt-2 text-sm font-semibold text-white">
          frontend foundation
        </div>
        <div className="mt-1 text-sm text-white/60">
          Sidebar, landing, settings form and mock data are ready.
        </div>
      </div>
    </div>
  );

  return (
    <Layout className="h-full min-h-full bg-transparent">
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          placement="left"
          closable={false}
          width={280}
          styles={{ body: { padding: 0 } }}
          onClose={() => setDrawerOpen(false)}
        >
          {menuNode}
        </Drawer>
      ) : (
        <Sider
          width={280}
          collapsible
          collapsed={sidebarCollapsed}
          collapsedWidth={96}
          trigger={null}
          className="h-full overflow-hidden"
          style={{ background: "#133129" }}
        >
          {menuNode}
        </Sider>
      )}

      <Layout className="flex h-full min-h-full flex-1 flex-col bg-transparent">
        <Header
          className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-black/5 bg-white/75 px-4 py-4 backdrop-blur-xl md:px-8"
          style={{ height: "auto", lineHeight: "normal" }}
        >
          <Space size="middle" align="start">
            <Button
              type="text"
              icon={
                isMobile ? (
                  <MenuUnfoldOutlined />
                ) : sidebarCollapsed ? (
                  <MenuUnfoldOutlined />
                ) : (
                  <MenuFoldOutlined />
                )
              }
              onClick={isMobile ? () => setDrawerOpen(true) : toggleSidebar}
            />
            <div>
              <Typography.Title level={3} className="!mb-0 !text-[#10201b]">
                {meta.title}
              </Typography.Title>
              <Typography.Text className="text-sm text-[#52625d]">
                {meta.subtitle}
              </Typography.Text>
            </div>
          </Space>

          <Space size="middle">
            <Tag color="green">MVP UI</Tag>
            <Link to="/">
              <Button>На лендинг</Button>
            </Link>
          </Space>
        </Header>

        <Content className="flex min-h-0 flex-1 p-4 md:p-8">
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
