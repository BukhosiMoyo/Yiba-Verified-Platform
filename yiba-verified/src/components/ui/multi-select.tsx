"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Multi-Select Component
 * Displays selected values as pills with remove buttons
 * Opens dropdown menu for selection
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  error,
  disabled,
  className,
  id,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectId = id || React.useId();

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const unselectedOptions = options.filter((opt) => !value.includes(opt.value));

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex min-h-10 w-full items-center gap-2 rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-left text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-300",
          "transition-all duration-150",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error &&
            "border-red-300 focus-visible:ring-red-500/20 focus-visible:border-red-400",
          isOpen && "border-blue-300 ring-2 ring-blue-500/20"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={error ? "true" : undefined}
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <Badge
                key={option.value}
                variant="outline"
                className="h-6 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => handleRemove(option.value, e)}
                  className="ml-1.5 rounded-full hover:bg-gray-200 p-0.5 transition-colors"
                  aria-label={`Remove ${option.label}`}
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <div
          className={cn(
            "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        >
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-lg border border-gray-200/80 bg-white shadow-lg"
          role="listbox"
        >
          <div className="max-h-60 overflow-auto p-1">
            {unselectedOptions.length > 0 ? (
              unselectedOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggle(option.value)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors duration-150",
                    "hover:bg-gray-50",
                    "focus:bg-gray-50 focus:outline-none"
                  )}
                  role="option"
                  aria-selected={false}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                All options selected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
