import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.22em]",
  {
    variants: {
      variant: {
        default: "bg-[#e5f3ee] text-[#11795f]",
        muted: "bg-black/5 text-[#5b6a65]",
        warm: "bg-[#fff1df] text-[#b26f12]",
        dark: "bg-white/10 text-white/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
