import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, ...props }, ref) => {
    // Defend against NaN being passed as value attribute
    const sanitizedValue = typeof value === "number" && Number.isNaN(value) ? "" : value;

    return (
      <input
        type={type}
        className={cn(
          "flex min-h-[44px] w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...(value !== undefined ? { value: sanitizedValue } : {})}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
