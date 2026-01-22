"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerV2Props {
  value?: string; // YYYY-MM-DD format
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  maxDate?: Date;
  minDate?: Date;
}

export function DatePickerV2({
  value,
  onChange,
  placeholder = "Pick a date",
  error = false,
  disabled = false,
  id,
  className,
  maxDate,
  minDate,
}: DatePickerV2Props) {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formatted = format(selectedDate, "yyyy-MM-dd");
      onChange?.(formatted);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            error && "border-destructive focus:ring-destructive/20 focus:border-destructive",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          showYearSwitcher={true}
          yearRange={50} // Show 50 years range for easier navigation to birth dates
          disabled={(date) => {
            if (maxDate && date > maxDate) return true;
            if (minDate && date < minDate) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
