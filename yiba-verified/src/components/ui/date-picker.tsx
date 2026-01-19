"use client";

import * as React from "react";
import { format, parse, isValid, addMonths, subMonths } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import "react-day-picker/src/style.css";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  error?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function toDate(s: string | undefined): Date | undefined {
  if (!s || s.length < 10) return undefined;
  const d = parse(s.slice(0, 10), "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

function toValue(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Date Picker Component
 * Custom calendar popover with premium styling. Displays YYYY-MM-DD.
 * No truncation: w-full, whitespace-nowrap, overflow-visible.
 */
const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ className, error, value, onChange, id, placeholder, disabled, ...rest }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [viewMonth, setViewMonth] = React.useState<Date>(() => new Date());
    const selected = toDate(value);
    const display = value && value.length >= 10 ? value.slice(0, 10) : "";

    React.useEffect(() => {
      if (open) setViewMonth(selected || new Date());
    }, [open, selected]);

    const handleSelect = (d: Date | undefined) => {
      if (d) {
        onChange?.({ target: { value: toValue(d) } } as React.ChangeEvent<HTMLInputElement>);
        setOpen(false);
      }
    };

    const handleClear = () => {
      onChange?.({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
      setOpen(false);
    };

    const handleToday = () => {
      onChange?.({ target: { value: toValue(new Date()) } } as React.ChangeEvent<HTMLInputElement>);
      setOpen(false);
    };

    const handlePrevMonth = () => setViewMonth((m) => subMonths(m, 1));
    const handleNextMonth = () => setViewMonth((m) => addMonths(m, 1));

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            id={id}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            {...rest}
            className={cn(
              "relative flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200/80 bg-white pl-3 pr-10 py-2 text-left text-sm text-gray-900 transition-all duration-150",
              "hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "whitespace-nowrap overflow-visible min-w-0",
              error && "border-red-300 focus:ring-red-500/20 focus:border-red-400",
              !display && "text-gray-400",
              className
            )}
          >
            <span className={cn("flex-1 overflow-visible whitespace-nowrap", display && "text-gray-900")}>
              {display || placeholder || "YYYY-MM-DD"}
            </span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-0">
              <Calendar
                className={cn("h-4 w-4 text-gray-400", error && "text-red-400")}
                strokeWidth={1.5}
              />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto rounded-xl border border-gray-200/60 bg-white p-3 shadow-lg"
          align="start"
          sideOffset={4}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            month={viewMonth}
            onMonthChange={setViewMonth}
            hideNavigation
            classNames={{
              root: "rdp-root",
              month: "space-y-2",
              month_caption: "flex justify-center px-1 !h-auto",
              caption_label: "text-sm font-semibold text-gray-900",
              weekdays: "flex",
              weekday: "w-8 text-[11px] font-medium uppercase tracking-wide text-gray-500",
              month_grid: "w-full border-collapse",
              week: "flex",
              day: "size-8 p-0",
              day_button: "size-8 rounded-md text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-1",
              selected: "!bg-blue-600 !text-white hover:!bg-blue-700 focus:!ring-blue-400",
              today: "ring-1 ring-blue-500/50 ring-offset-1",
              outside: "text-gray-300",
            }}
          />
          <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="px-2 sm:px-2.5"
              >
                <ChevronLeft className="size-4 shrink-0 text-gray-600" aria-hidden />
                <span className="hidden sm:inline ml-0.5">Prev</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="px-2 sm:px-2.5"
              >
                <span className="hidden sm:inline mr-0.5">Next</span>
                <ChevronRight className="size-4 shrink-0 text-gray-600" aria-hidden />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClear}>
                Clear
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleToday}>
                Today
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
