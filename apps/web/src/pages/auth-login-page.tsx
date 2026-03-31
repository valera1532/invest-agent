import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { loginUser } from "@/features/auth/api/auth";
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

export function AuthLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (profile) => {
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("Вход выполнен");
      navigate({
        to: profile.hasTbankToken ? "/app/overview" : "/auth/connect-token",
      });
    },
    onError: () => toast.error("Не удалось войти. Проверь email и пароль."),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="glass-panel w-full max-w-xl border-0">
        <CardHeader>
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#6c7a74]">
            auth
          </div>
          <CardTitle>Вход в Invest Agent</CardTitle>
          <CardDescription>
            Сначала входим в приложение, а потом подключаем пользовательский
            T-Bank токен.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate({ email, password });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Минимум 8 символов"
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={loginMutation.isPending}
            >
              Войти
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#52625d]">
            Нет аккаунта?{" "}
            <Link to="/auth/register" className="font-medium text-[#11795f]">
              Создать аккаунт
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
