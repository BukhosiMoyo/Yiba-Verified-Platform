"use client";

const CHIP = "text-xs px-2 py-0.5 rounded-full border truncate max-w-[140px] inline-block";

function chipClass(variant: "muted" | "new" | "created" | "deleted" | "red") {
  switch (variant) {
    case "muted":
      return "bg-gray-100 text-gray-600 border-gray-200 " + CHIP;
    case "new":
      return "bg-green-100 text-green-800 border-green-200 " + CHIP;
    case "created":
      return "bg-blue-100 text-blue-800 border-blue-200 " + CHIP;
    case "deleted":
      return "bg-red-100 text-red-800 border-red-200 " + CHIP;
    case "red":
      return "bg-red-100 text-red-800 border-red-200 " + CHIP;
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 " + CHIP;
  }
}

function formatDisplay(v: string | null): string {
  if (v == null || v === "") return "—";
  try {
    const p = JSON.parse(v);
    return typeof p === "string" ? p : JSON.stringify(p);
  } catch {
    return v;
  }
}

function shorten(s: string, len = 28): string {
  if (s.length <= len) return s;
  return s.slice(0, len) + "…";
}

/** Status-like values for semantic "To" chip color */
function isPositiveStatus(s: string): boolean {
  const u = s.toUpperCase();
  return ["ACTIVE", "APPROVED", "ENABLED", "TRUE", "1"].includes(u);
}
function isNegativeStatus(s: string): boolean {
  const u = s.toUpperCase();
  return ["INACTIVE", "REJECTED", "DISABLED", "FALSE", "0"].includes(u);
}

interface AuditLogDiffViewerProps {
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
}

/**
 * Compact inline diff: From: [old] → To: [new].
 * Empty shows — in muted (no heavy red). One line preferred; truncate with tooltip from parent.
 */
export function AuditLogDiffViewer({
  oldValue,
  newValue,
  changeType,
}: AuditLogDiffViewerProps) {
  if (changeType === "CREATE") {
    const n = formatDisplay(newValue);
    return (
      <span className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
        <span className={chipClass("created")}>Created</span>
        <span className="text-muted-foreground shrink-0" aria-hidden>→</span>
        {n === "—" ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          <span className={chipClass("new")} title={n}>{shorten(n)}</span>
        )}
      </span>
    );
  }

  if (changeType === "DELETE") {
    const o = formatDisplay(oldValue);
    return (
      <span className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
        {o === "—" ? (
          <span className="text-muted-foreground text-xs">—</span>
        ) : (
          <span className={chipClass("muted")} title={o}>{shorten(o)}</span>
        )}
        <span className="text-muted-foreground shrink-0" aria-hidden>→</span>
        <span className={chipClass("deleted")}>Deleted</span>
      </span>
    );
  }

  // UPDATE or STATUS_CHANGE: From: [old] → To: [new]
  const o = formatDisplay(oldValue);
  const n = formatDisplay(newValue);

  const toClass =
    n !== "—" && isPositiveStatus(n)
      ? chipClass("new")
      : n !== "—" && isNegativeStatus(n)
        ? chipClass("red")
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
      <span className="text-muted-foreground shrink-0" aria-hidden>→</span>
      <span className="text-[11px] text-muted-foreground shrink-0">To:</span>
      {n === "—" ? (
        <span className="text-muted-foreground text-xs">—</span>
      ) : (
        <span className={toClass || chipClass("new")} title={n}>{shorten(n)}</span>
      )}
    </span>
  );
}
