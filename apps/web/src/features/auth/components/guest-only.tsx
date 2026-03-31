import { useEffect } from "react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/features/auth/api/auth";
import { Spinner } from "@/components/ui/spinner";

export function GuestOnly() {
  const navigate = useNavigate();
  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data?.hasTbankToken) {
      navigate({ to: "/app/overview", replace: true });
    } else if (meQuery.data) {
      navigate({ to: "/auth/connect-token", replace: true });
    }
  }, [meQuery.data, navigate]);

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (meQuery.data) {
    return null;
  }

  return <Outlet />;
}
