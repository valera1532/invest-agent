import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-[#10201b] outline-none transition focus:border-[#11795f] focus:ring-2 focus:ring-[#11795f]/15",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
