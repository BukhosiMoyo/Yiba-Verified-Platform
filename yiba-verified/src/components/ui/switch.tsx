"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, error, id, checked, disabled, onChange, onCheckedChange, ...props }, ref) => {
    const switchId = id || React.useId();
    
    // Handle both onChange (standard) and onCheckedChange (convenience prop)
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      // Call onChange if provided (standard HTML behavior)
      if (onChange) {
        onChange(e);
      }
      // Also call onCheckedChange with just the boolean value (convenience)
      if (onCheckedChange && typeof onCheckedChange === 'function') {
        onCheckedChange(e.target.checked);
      }
    }, [onChange, onCheckedChange]);

    return (
      <div className="flex items-center gap-2.5">
        <label htmlFor={switchId} className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className={cn("peer sr-only", className)}
            {...props}
          />
          <div
            className={cn(
              "relative h-6 w-11 rounded-full transition-all duration-200 ease-in-out",
              "bg-gray-200 peer-checked:bg-blue-600",
              "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/20 peer-focus-visible:ring-offset-1",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              error && "bg-red-100 peer-checked:bg-red-600 peer-focus-visible:ring-red-500/20",
              disabled && "cursor-not-allowed"
            )}
            role="switch"
            aria-checked={checked}
            aria-labelledby={label ? `${switchId}-label` : undefined}
            aria-disabled={disabled}
          >
            <div
              className={cn(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                "peer-checked:translate-x-5"
              )}
            />
          </div>
        </label>
        {label && (
          <label
            id={`${switchId}-label`}
            htmlFor={switchId}
            className={cn(
              "text-sm font-medium leading-none cursor-pointer select-none",
              "text-gray-700",
              disabled && "cursor-not-allowed opacity-50",
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
Switch.displayName = "Switch";

export { Switch };
