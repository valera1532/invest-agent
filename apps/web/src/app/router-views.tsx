import { Link, Outlet } from "@tanstack/react-router";
import { AppProviders } from "./providers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card className="max-w-lg text-center">
        <CardHeader>
          <CardTitle>Страница не найдена</CardTitle>
          <CardDescription>
            Похоже, этот маршрут еще не описан в новом клиенте.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/">На лендинг</Link>
          </Button>
          <Button asChild>
            <Link to="/app/overview">В кабинет</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
