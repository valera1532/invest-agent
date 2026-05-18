import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  connectTbankToken,
  disconnectTbankToken,
  getCurrentUser,
  logoutUser,
} from "@/features/auth/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function ConnectTokenPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  const connectMutation = useMutation({
    mutationFn: connectTbankToken,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("T-Bank токен подключен");
      navigate({ to: "/app/overview" });
    },
    onError: () => toast.error("Не удалось проверить токен T-Bank"),
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectTbankToken,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("Токен отключен");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      navigate({ to: "/auth/login" });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="glass-panel w-full max-w-2xl border-0">
        <CardHeader>
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#6c7a74]">
            broker setup
          </div>
          <CardTitle>Подключить T-Bank токен</CardTitle>
          <CardDescription>
            Аккаунт уже создан. Теперь привяжи личный T-Invest API token, чтобы
            кабинет работал от имени этого пользователя.
          </CardDescription>
          <CardDescription>
            Если хочешь видеть все брокерские счета и все инструменты, выпускай
            токен с доступом ко всем счетам, а не к одному конкретному счету.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meQuery.data?.tbankTokenMasked ? (
            <div className="mb-6 rounded-2xl bg-[#f6faf7] px-5 py-4 text-sm text-[#30453f]">
              Текущий подключенный токен:{" "}
              <Badge
                className="ml-2 inline-flex normal-case tracking-normal"
                variant="muted"
              >
                {meQuery.data.tbankTokenMasked}
              </Badge>
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              connectMutation.mutate(token);
            }}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="tbank-token">T-Bank token</Label>
                <a
                  href="https://www.tbank.ru/invest/settings/api/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-[#11795f] underline-offset-4 hover:underline"
                >
                  Где взять токен?
                </a>
              </div>
              <Input
                id="tbank-token"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Вставь свой read-only или full-access токен"
                required
              />
              <p className="text-sm leading-6 text-[#60716a]">
                Открой страницу настроек T-Bank Invest API, выпусти токен и
                вставь его сюда.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                size="lg"
                loading={connectMutation.isPending}
              >
                Проверить и сохранить
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => logoutMutation.mutate()}
                loading={logoutMutation.isPending}
              >
                Выйти
              </Button>
              {meQuery.data?.tbankTokenMasked ? (
                <Button
                  type="button"
                  variant="danger"
                  size="lg"
                  onClick={() => disconnectMutation.mutate()}
                  loading={disconnectMutation.isPending}
                >
                  Отключить токен
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
