"use client";

import { ReactNode } from "react";
import { TableCell } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedCellProps {
  value: ReactNode;
  className?: string;
  maxWidth?: string;
  alwaysShowTooltip?: boolean;
}

/**
 * TruncatedCell Component
 * 
 * A TableCell that truncates overflow text and shows a tooltip on hover
 * with the full content. Perfect for table-heavy admin pages.
 */
export function TruncatedCell({
  value,
  className,
  maxWidth,
  alwaysShowTooltip = false,
}: TruncatedCellProps) {
  const stringValue = typeof value === "string" ? value : String(value || "");

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <TableCell
            className={cn(
              "whitespace-nowrap truncate overflow-hidden text-ellipsis",
              maxWidth && `max-w-[${maxWidth}]`,
              className
            )}
          >
            {value}
          </TableCell>
        </TooltipTrigger>
        {(alwaysShowTooltip || stringValue.length > 0) && (
          <TooltipContent
            side="top"
            className="max-w-md break-words text-xs z-50"
          >
            <p>{stringValue}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
