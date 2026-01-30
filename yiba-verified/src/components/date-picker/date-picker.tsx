"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"

interface DatePickerProps {
  id?: string;
  value?: string; // YYYY-MM-DD format
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function toDate(s: string | undefined): Date | undefined {
  if (!s || s.length < 10) return undefined;
  const d = parse(s.slice(0, 10), "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

function toValue(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function DatePicker({ 
  id,
  value, 
  onChange, 
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);

  const handleSelect = (d: Date | undefined) => {
    if (d) {
      onChange?.({ target: { value: toValue(d) } });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-card border border-border shadow-lg" align="start">
        <Calendar 
          mode="single" 
          selected={selected} 
          onSelect={handleSelect} 
          autoFocus 
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker;
