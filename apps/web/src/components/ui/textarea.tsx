import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-28 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#10201b] outline-none transition focus:border-[#11795f] focus:ring-2 focus:ring-[#11795f]/15",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
