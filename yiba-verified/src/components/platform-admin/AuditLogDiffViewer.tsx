"use client";

import { ArrowRight } from "lucide-react";
import { formatValueForDisplay } from "@/lib/audit-display";

const CHIP = "rounded-full px-2.5 py-1 text-xs font-medium border truncate max-w-[160px] inline-block";

function chipClass(variant: "muted" | "new" | "created" | "deleted" | "red" | "pending") {
  switch (variant) {
    case "muted":
      return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700 " + CHIP;
    case "new":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800 " + CHIP;
    case "created":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800 " + CHIP;
    case "deleted":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800 " + CHIP;
    case "red":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800 " + CHIP;
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800 " + CHIP;
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700 " + CHIP;
  }
}

function shorten(s: string, len = 28): string {
  if (s.length <= len) return s;
  return s.slice(0, len) + "…";
}

/** Status-like values for semantic "To" chip: Active/Approved = green */
function isPositiveStatus(s: string): boolean {
  const u = s.toUpperCase();
  return ["ACTIVE", "APPROVED", "ENABLED", "TRUE", "1"].includes(u);
}
/** Disabled/Inactive = red */
function isNegativeStatus(s: string): boolean {
  const u = s.toUpperCase();
  return ["INACTIVE", "REJECTED", "DISABLED", "FALSE", "0"].includes(u);
}
/** Pending = amber */
function isPendingStatus(s: string): boolean {
  const u = s.toUpperCase();
  return ["PENDING", "SUBMITTED", "IN_REVIEW", "IN_PROGRESS"].includes(u);
}

interface AuditLogDiffViewerProps {
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
  /** When the value is a large object, we try to show this key (e.g. "status") instead of "N fields". */
  fieldName?: string | null;
}

/**
 * Compact inline diff: From: [old] → To: [new].
 * Empty shows — in muted (no heavy red). One line preferred; truncate with tooltip from parent.
 */
export function AuditLogDiffViewer({
  oldValue,
  newValue,
  changeType,
  fieldName,
}: AuditLogDiffViewerProps) {
  const fmt = (x: string | null) => formatValueForDisplay(x, fieldName);
  if (changeType === "CREATE") {
    const n = fmt(newValue);
    return (
      <span className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
        <span className={chipClass("created")}>Created</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
        {n === "—" ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          <span className={chipClass("new")} title={n}>{shorten(n)}</span>
        )}
      </span>
    );
  }

  if (changeType === "DELETE") {
    const o = fmt(oldValue);
    return (
      <span className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
        {o === "—" ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          <span className={chipClass("muted")} title={o}>{shorten(o)}</span>
        )}
        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
        <span className={chipClass("deleted")}>Deleted</span>
      </span>
    );
  }

  // UPDATE or STATUS_CHANGE: From: [old] → To: [new]. Empty from shows — (not "(empty)").
  const o = fmt(oldValue);
  const n = fmt(newValue);

  const toClass =
    n !== "—" && isPositiveStatus(n)
      ? chipClass("new")
      : n !== "—" && isNegativeStatus(n)
        ? chipClass("red")
        : n !== "—" && isPendingStatus(n)
          ? chipClass("pending")
          : n !== "—"
            ? chipClass("new")
            : "";

  return (
    <span className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
      <span className="text-[11px] text-muted-foreground shrink-0">From:</span>
      {o === "—" ? (
        <span className="text-muted-foreground text-xs">—</span>
      ) : (
        <span className={chipClass("muted")} title={o}>{shorten(o)}</span>
      )}
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
      <span className="text-[11px] text-muted-foreground shrink-0">To:</span>
      {n === "—" ? (
        <span className="text-muted-foreground text-xs">—</span>
      ) : (
        <span className={toClass || chipClass("new")} title={n}>{shorten(n)}</span>
      )}
    </span>
  );
}
