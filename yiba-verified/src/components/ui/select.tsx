"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// Simple Select component using native select with styled wrapper
// For a full-featured select with search, use @radix-ui/react-select (needs to be installed)

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-300 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8",
            props["aria-invalid"] === true && "border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-400",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-gray-400" strokeWidth={1.5} />
      </div>
    );
  }
);
Select.displayName = "Select";

const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  SelectProps
>(({ className, ...props }, ref) => (
  <Select ref={ref} className={className} {...props} />
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return null; // Placeholder for API compatibility
};

const SelectContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return null; // Not used with native select
};

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, ...props }, ref) => (
  <option ref={ref} className={className} {...props} />
));
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
