import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getCurrentUser } from "@/features/auth/api/auth";
import { AppShell } from "@/components/app-shell";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedApp() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      navigate({ to: "/auth/login", replace: true });
      return;
    }

    if (
      meQuery.data &&
      !meQuery.data.hasTbankToken &&
      pathname !== "/auth/connect-token"
    ) {
      navigate({ to: "/auth/connect-token", replace: true });
    }
  }, [meQuery.data, meQuery.isError, navigate, pathname]);

  if (meQuery.isLoading) {
    return (
      <div className="flex h-full min-h-full flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-[#5a6b65]">
          Проверяем сессию пользователя...
        </p>
      </div>
    );
  }

  if (!meQuery.data || !meQuery.data.hasTbankToken) {
    return null;
  }

  return <AppShell />;
}
