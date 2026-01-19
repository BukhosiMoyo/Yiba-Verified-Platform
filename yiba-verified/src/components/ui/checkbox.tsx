"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || React.useId();

    return (
      <div className="flex items-center gap-2.5">
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={cn(
              "peer h-4 w-4 shrink-0 rounded border border-gray-300 bg-white text-blue-600 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "checked:border-blue-600 checked:bg-blue-600",
              error && "border-red-300 focus-visible:ring-red-500/20",
              className
            )}
            {...props}
          />
          <Check
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-150",
              "peer-checked:opacity-100"
            )}
            strokeWidth={2.5}
          />
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              "text-sm font-medium leading-none cursor-pointer select-none",
              "text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "text-red-700"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
