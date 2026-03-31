import type { ReactNode } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type QueryStateProps = {
  isLoading: boolean;
  error: Error | null;
  children: ReactNode;
};

export function QueryState({ isLoading, error, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertIcon />
        <div>
          <AlertTitle>Не удалось загрузить данные</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </div>
      </Alert>
    );
  }

  return <>{children}</>;
}
