import { Link, Outlet } from "@tanstack/react-router";
import { Button, Result, Space } from "antd";
import { AppProviders } from "./providers";

export function RootComponent() {
  return (
    <AppProviders>
      <div className="h-full">
        <Outlet />
      </div>
    </AppProviders>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Result
        status="404"
        title="Страница не найдена"
        subTitle="Похоже, этот маршрут еще не описан в новом клиенте."
        extra={
          <Space>
            <Link to="/">
              <Button>На лендинг</Button>
            </Link>
            <Link to="/app/overview">
              <Button type="primary">В кабинет</Button>
            </Link>
          </Space>
        }
      />
    </div>
  );
}
