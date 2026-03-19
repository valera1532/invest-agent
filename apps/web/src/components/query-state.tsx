import type { ReactNode } from "react";
import { Alert, Skeleton } from "antd";

type QueryStateProps = {
  isLoading: boolean;
  error: Error | null;
  children: ReactNode;
};

export function QueryState({ isLoading, error, children }: QueryStateProps) {
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить данные"
        description={error.message}
      />
    );
  }

  return <>{children}</>;
}
