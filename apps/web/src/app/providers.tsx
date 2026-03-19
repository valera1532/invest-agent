import { useState } from "react";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntApp, ConfigProvider } from "antd";

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

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#11795f",
          colorInfo: "#11795f",
          colorSuccess: "#1e8b68",
          colorWarning: "#db8d30",
          colorBgLayout: "#eef4ef",
          colorBgContainer: "#ffffff",
          borderRadius: 18,
          fontFamily: '"Manrope", "Segoe UI", sans-serif',
        },
      }}
    >
      <AntApp className="app-frame">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
