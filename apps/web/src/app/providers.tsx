import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { registerSessionExpiredHandler } from "@/features/auth/lib/session-events";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    return registerSessionExpiredHandler(() => {
      queryClient.setQueryData(["auth-me"], null);
      queryClient.removeQueries({ queryKey: ["dashboard-overview"] });
      queryClient.removeQueries({ queryKey: ["portfolio-snapshot"] });
      queryClient.removeQueries({ queryKey: ["market-highlights"] });
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-frame">
        {children}
        <Toaster richColors position="top-right" />
      </div>
    </QueryClientProvider>
  );
}
