"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  error?: boolean;
  /** Radix UI style change handler (for compatibility) */
  onCheckedChange?: (checked: boolean) => void;
  /** Standard input onChange handler */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, onCheckedChange, onChange, ...props }, ref) => {
    const checkboxId = id || React.useId();

    // Handle both onChange and onCheckedChange patterns
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        onCheckedChange?.(e.target.checked);
      },
      [onChange, onCheckedChange]
    );

    return (
      <div className="flex items-center gap-2.5">
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            onChange={handleChange}
            className={cn(
              "peer h-4 w-4 shrink-0 rounded border border-border bg-card text-primary transition-all duration-150",
              "dark:border-border dark:bg-card",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "checked:border-primary checked:bg-primary dark:checked:border-primary dark:checked:bg-primary",
              error && "border-red-300 dark:border-red-700 focus-visible:ring-red-500/20",
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
              "text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "text-red-700 dark:text-red-400"
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
