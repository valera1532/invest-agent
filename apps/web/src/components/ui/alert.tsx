import type { HTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-[#f0caca] bg-[#fff5f5] p-4 text-[#923737]",
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-semibold", className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6", className)} {...props} />;
}

export function AlertIcon() {
  return <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />;
}
