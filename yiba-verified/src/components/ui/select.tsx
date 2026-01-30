"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// Native select component with support for both:
// 1. Radix-like API: <Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem /></SelectContent></Select>
// 2. Native HTML API: <Select onChange={...}><option value="...">...</option></Select>

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  children?: React.ReactNode;
}

// Check if children are SelectItem components (Radix-style) or native option elements
function hasSelectItems(children: React.ReactNode): boolean {
  let hasItems = false;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if ((child.type as any)?.displayName === 'SelectItem') {
      hasItems = true;
    }
    if ((child.type as any)?.displayName === 'SelectContent') {
      hasItems = true;
    }
    if ((child.type as any)?.displayName === 'SelectTrigger') {
      // SelectTrigger is part of Radix API
      hasItems = true;
    }
  });
  return hasItems;
}

// Collect SelectItem children from Radix-style API
function collectItems(children: React.ReactNode): { value: string; children: React.ReactNode }[] {
  const items: { value: string; children: React.ReactNode }[] = [];
  
  const traverse = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;
      
      const displayName = (child.type as any)?.displayName;
      
      if (displayName === 'SelectItem') {
        const p = child.props as { value: string; children: React.ReactNode };
        items.push({
          value: p.value,
          children: p.children,
        });
      } else if (displayName === 'SelectContent') {
        traverse((child.props as { children: React.ReactNode }).children);
      }
      // Skip SelectTrigger - it doesn't contain items
    });
  };
  
  traverse(children);
  return items;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, defaultValue, onValueChange, onChange, disabled, id, ...props }, ref) => {
    const isRadixStyle = hasSelectItems(children);
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    // For Radix-style API, collect items and render native options
    if (isRadixStyle) {
      const items = collectItems(children);
      
      return (
        <div className={cn("relative", className)}>
          <select
            ref={ref}
            id={id}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-150",
              "disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8",
              "dark:border-border dark:bg-card dark:text-foreground"
            )}
            {...props}
          >
            {items.map((item) => (
              <option key={item.value} value={item.value}>
                {item.children}
              </option>
            ))}
          </select>
          <ChevronDown 
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted-foreground" 
            strokeWidth={1.5} 
          />
        </div>
      );
    }

    // For native HTML API with <option> children
    return (
      <div className={cn("relative", className)}>
        <select
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-150",
            "disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8",
            "dark:border-border dark:bg-card dark:text-foreground"
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown 
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted-foreground" 
          strokeWidth={1.5} 
        />
      </div>
    );
  }
);
Select.displayName = "Select";

// These components are for Radix API compatibility
// They don't render directly - Select processes them

const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; id?: string }
>(({ className, children, id }, ref) => {
  // Marker component - doesn't render directly
  return null;
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  // Marker component - doesn't render directly
  return null;
};
SelectValue.displayName = "SelectValue";

const SelectContent = ({ children }: { children?: React.ReactNode }) => {
  // Marker component - doesn't render directly  
  return null;
};
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  { value: string; children?: React.ReactNode; className?: string }
>(({ value, children, className }, ref) => {
  // Marker component - doesn't render directly
  return null;
});
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
