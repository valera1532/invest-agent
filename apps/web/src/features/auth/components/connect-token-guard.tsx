import { useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/auth/api/auth";
import { Spinner } from "@/components/ui/spinner";

export function ConnectTokenGuard() {
  const navigate = useNavigate();
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

    if (meQuery.data?.hasTbankToken) {
      navigate({ to: "/app/overview", replace: true });
    }
  }, [meQuery.data, meQuery.isError, navigate]);

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-[#5a6b65]">
          Проверяем подключение брокера...
        </p>
      </div>
    );
  }

  if (!meQuery.data || meQuery.data.hasTbankToken) {
    return null;
  }

  return <Outlet />;
}
