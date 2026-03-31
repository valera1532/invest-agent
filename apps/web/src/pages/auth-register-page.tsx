import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { registerUser } from "@/features/auth/api/auth";
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

export function AuthRegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("Аккаунт создан");
      navigate({ to: "/auth/connect-token" });
    },
    onError: () =>
      toast.error("Не удалось зарегистрироваться. Возможно, email уже занят."),
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="glass-panel w-full max-w-xl border-0">
        <CardHeader>
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#6c7a74]">
            register
          </div>
          <CardTitle>Создать аккаунт</CardTitle>
          <CardDescription>
            После регистрации ты сможешь подключить личный T-Bank токен и
            работать уже от имени своего пользователя.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              registerMutation.mutate({ name, email, password });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Valerii"
                required
              />
            </div>
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
                autoComplete="new-password"
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
              loading={registerMutation.isPending}
            >
              Зарегистрироваться
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[#52625d]">
            Уже есть аккаунт?{" "}
            <Link to="/auth/login" className="font-medium text-[#11795f]">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
