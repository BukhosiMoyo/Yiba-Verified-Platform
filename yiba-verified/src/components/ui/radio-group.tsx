"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  onValueChange?: (value: string) => void;
  error?: boolean;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, error, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2.5", className)}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              // @ts-ignore
              name: child.props.name || "radio-group",
              checked: child.props.value === value,
              onCheckedChange: onValueChange,
              error,
            } as any);
          }
          return child;
        })}
      </div>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

export interface RadioItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  value: string;
  checked?: boolean;
  onCheckedChange?: (value: string) => void;
  error?: boolean;
}

const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  (
    {
      className,
      label,
      value,
      checked,
      onCheckedChange,
      error,
      id,
      name,
      ...props
    },
    ref
  ) => {
    const radioId = id || React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.value);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="flex items-center gap-2.5">
        <div className="relative inline-flex items-center">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            name={name}
            value={value}
            checked={checked}
            onChange={handleChange}
            className={cn(
              "peer h-4 w-4 shrink-0 rounded-full border border-gray-300 bg-white text-blue-600 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "checked:border-blue-600",
              error && "border-red-300 focus-visible:ring-red-500/20",
              className
            )}
            {...props}
          />
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 opacity-0 transition-opacity duration-150",
              "peer-checked:opacity-100"
            )}
          />
        </div>
        {label && (
          <label
            htmlFor={radioId}
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
RadioItem.displayName = "RadioItem";

export { RadioGroup, RadioItem };
