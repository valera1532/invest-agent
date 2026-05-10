import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11795f]/50",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,#179f79_0%,#0f7f61_56%,#0b684f_100%)] text-white shadow-[0_16px_40px_rgba(13,101,77,0.24)] hover:-translate-y-[1px] hover:bg-[linear-gradient(135deg,#1bc18f_0%,#0f9571_56%,#0c7458_100%)] hover:shadow-[0_20px_48px_rgba(13,101,77,0.32)]",
        secondary: "bg-[#e7efe9] text-[#17362f] hover:bg-[#dce7e1]",
        ghost: "bg-transparent text-inherit hover:bg-black/5",
        outline:
          "border border-black/10 bg-white text-[#17362f] hover:bg-[#f6faf7]",
        danger: "bg-[#b84d4d] text-white hover:bg-[#9c3f3f]",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-2xl px-5 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
