"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AuditLogDiffViewer } from "@/components/platform-admin/AuditLogDiffViewer";
import { AuditLogDetailModal } from "@/components/platform-admin/AuditLogDetailModal";
import { formatFieldLabel, formatValueForDisplay } from "@/lib/audit-display";
import { EmptyState } from "@/components/shared/EmptyState";
import { Eye, ClipboardList } from "lucide-react";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

// ---------------------------------------------------------------------------
// AuditCellWithTooltip — shared helper for this page only
// ---------------------------------------------------------------------------
function AuditCellWithTooltip({
  value,
  className,
  maxWidth = "max-w-[200px]",
}: {
  value: string;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={`block truncate overflow-hidden text-ellipsis whitespace-nowrap ${maxWidth} ${className ?? ""}`}
          >
            {value || "—"}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm text-xs break-words whitespace-pre-wrap">
          {value || "—"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const PILL_BASE = "rounded-full px-2.5 py-1 text-xs font-medium border shrink-0";

function getRoleChip(role: string) {
  const label = role.replace(/_/g, " ");
  return (
    <span className={`${PILL_BASE} bg-slate-100 text-slate-700 border-slate-200 dark:bg-muted dark:text-muted-foreground dark:border-border`}>
      {label}
    </span>
  );
}

function getActionChip(changeType: string) {
  const T: Record<string, { label: string; c: string }> = {
    CREATE: { label: "Created", c: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400/80 dark:border-blue-500/20" },
    UPDATE: { label: "Updated", c: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-muted dark:text-muted-foreground dark:border-border" },
    STATUS_CHANGE: { label: "Status changed", c: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400/80 dark:border-amber-500/20" },
    DELETE: { label: "Deleted", c: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400/80 dark:border-red-500/20" },
  };
  const t = T[changeType] ?? { label: changeType, c: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-muted dark:text-muted-foreground dark:border-border" };
  return <span className={`${PILL_BASE} ${t.c}`}>{t.label}</span>;
}

// ---------------------------------------------------------------------------
// Types (matches server-included shape; dates may be serialized as strings)
// ---------------------------------------------------------------------------
type AuditLogEntry = {
  audit_id: string;
  changed_at: Date | string;
  changed_by: string | null;
  change_type: string;
  entity_type: string;
  entity_id: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  role_at_time: string;
  changedBy?: {
    user_id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  institution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  relatedSubmission?: {
    submission_id: string;
    title: string | null;
    status: string | null;
  } | null;
  relatedQCTORequest?: {
    request_id: string;
    title: string | null;
    status: string | null;
  } | null;
  oldInstitution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  newInstitution?: {
    institution_id: string;
    legal_name: string | null;
    trading_name: string | null;
  } | null;
  entityUser?: {
    user_id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    role: string;
    status: string;
    institution: {
      institution_id: string;
      legal_name: string | null;
      trading_name: string | null;
    } | null;
  } | null;
};

export interface AuditLogsTableClientProps {
  logs: AuditLogEntry[];
  totalCount: number;
  limit: number;
  offset: number;
  params: {
    entity_type?: string;
    entity_id?: string;
    change_type?: string;
    institution_id?: string;
    changed_by?: string;
    start_date?: string;
    end_date?: string;
    limit?: string;
    offset?: string;
  };
  /** Base path for pagination links, e.g. /platform-admin/audit-logs or /qcto/audit-logs */
  basePath?: string;
}

function formatChangeType(changeType: string) {
  switch (changeType) {
    case "CREATE":
      return { label: "Created", variant: "default" as const };
    case "UPDATE":
      return { label: "Updated", variant: "secondary" as const };
    case "DELETE":
      return { label: "Deleted", variant: "destructive" as const };
    case "STATUS_CHANGE":
      return { label: "Status Changed", variant: "outline" as const };
    default:
      return { label: changeType, variant: "outline" as const };
  }
}

function formatEntityType(entityType: string) {
  return entityType.charAt(0) + entityType.slice(1).toLowerCase();
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Format old/new for tooltip or code block */
function formatValue(v: string | null): string {
  if (v == null) return "(empty)";
  try {
    const p = JSON.parse(v);
    return JSON.stringify(p, null, 2);
  } catch {
    return v;
  }
}

const PAGE_SIZE_KEY_PLATFORM = "yv_table_page_size:platform_admin_audit_logs";
const PAGE_SIZE_KEY_QCTO = "yv_table_page_size:qcto_audit_logs";

export function AuditLogsTableClient({
  logs,
  totalCount,
  limit,
  offset,
  params,
  basePath = "/platform-admin/audit-logs",
}: AuditLogsTableClientProps) {
  const router = useRouter();
  const [viewEntry, setViewEntry] = useState<AuditLogEntry | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });
  const isQcto = basePath.startsWith("/qcto");
  const institutionsPath = isQcto ? "/qcto/institutions" : "/platform-admin/institutions";
  const submissionsPath = isQcto ? "/qcto/submissions" : "/institution/submissions";
  const pageSizeKey = isQcto ? PAGE_SIZE_KEY_QCTO : PAGE_SIZE_KEY_PLATFORM;

  const hasActiveFilters = !!(
    params.entity_type ||
    params.entity_id ||
    params.change_type ||
    params.institution_id ||
    params.changed_by ||
    params.start_date ||
    params.end_date
  );

  const buildParamsForLimit = (newLimit: number) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") q.set(k, String(v));
    });
    q.set("limit", String(newLimit));
    q.set("offset", "0");
    return q.toString();
  };

  const paginationParams = (newOffset: number) => {
    const p = { ...params, limit: String(limit), offset: String(newOffset) };
    return new URLSearchParams(p).toString();
  };

  const handlePageSizeChange = (n: number) => {
    try {
      localStorage.setItem(pageSizeKey, String(n));
    } catch (_) { /* ignore */ }
    router.push(`${basePath}?${buildParamsForLimit(n)}`);
  };

  useEffect(() => {
    if (typeof window === "undefined" || params.limit) return;
    try {
      const s = localStorage.getItem(pageSizeKey);
      if (s) {
        const n = parseInt(s, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          const q = new URLSearchParams();
          Object.entries(params).forEach(([k, v]) => {
            if (v != null && v !== "") q.set(k, String(v));
          });
          q.set("limit", String(n));
          q.set("offset", "0");
          router.replace(`${basePath}?${q.toString()}`);
        }
      }
    } catch (_) { /* ignore */ }
  }, [basePath, pageSizeKey, params]);

  const showing = logs.length
    ? `${offset + 1}–${Math.min(offset + logs.length, offset + limit)}`
    : "0";

  return (
    <>
      <div className="w-full min-w-0 space-y-0">
        {logs.length === 0 ? (
          <EmptyState
            title="No audit entries found."
            description={
              hasActiveFilters
                ? "Try adjusting your filters."
                : "When changes happen in the system, they'll appear here."
            }
            icon={<ClipboardList className="h-6 w-6" strokeWidth={1.5} />}
            variant={hasActiveFilters ? "no-results" : "default"}
          />
        ) : (
          <div className="w-full min-w-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div
              ref={parentRef}
              className="overflow-x-auto overflow-y-auto"
              style={{ height: "60vh", minHeight: 320 }}
            >
              <Table className="border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5 w-12">
                      #
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5 w-[152px]">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5 min-w-[180px]">
                      User
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5">
                      Action
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5">
                      Entity
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5">
                      Field
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-2.5 min-w-[200px]">
                      Change
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-2.5 min-w-[120px] max-w-[180px]">
                      Reason
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5 min-w-[140px]">
                      Related
                    </TableHead>
                    <TableHead className="sticky right-0 z-10 bg-muted/50 border-l border-border text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap py-2.5 w-[88px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody
                  style={{
                    height: virtualizer.getTotalSize(),
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const log = logs[virtualRow.index];
                    const index = virtualRow.index;
                    const userName =
                      log.changedBy?.first_name || log.changedBy?.last_name
                        ? `${(log.changedBy.first_name || "").trim()} ${(log.changedBy.last_name || "").trim()}`.trim()
                        : null;
                    const userEmail = log.changedBy?.email || log.changed_by || null;
                    const userLine1 = userName || userEmail || "—";
                    const userLine2 = userName && userEmail ? userEmail : null;
                    const userTooltip = [userLine1, userLine2].filter(Boolean).join("\n") || "—";
                    const relatedLines: string[] = [];
                    if (log.institution) {
                      relatedLines.push(`Institution: ${log.institution.trading_name || log.institution.legal_name || log.institution.institution_id}`);
                    }
                    if (log.relatedSubmission) {
                      relatedLines.push(`Submission: ${log.relatedSubmission.title || log.relatedSubmission.submission_id}`);
                    }
                    if (log.relatedQCTORequest) {
                      relatedLines.push(`Request: ${log.relatedQCTORequest.title || log.relatedQCTORequest.request_id}`);
                    }
                    const relatedTooltip = relatedLines.length ? relatedLines.join("\n") : "—";
                    const relatedCell =
                      relatedLines.length > 0
                        ? [
                            log.institution && (
                              <Link
                                key="i"
                                href={`${institutionsPath}/${log.institution.institution_id}`}
                                className="text-xs text-primary hover:underline block truncate"
                              >
                                {log.institution.trading_name || log.institution.legal_name}
                              </Link>
                            ),
                            log.relatedSubmission && (
                              <Link
                                key="s"
                                href={`${submissionsPath}/${log.relatedSubmission.submission_id}`}
                                className="text-xs text-primary hover:underline block truncate"
                              >
                                Submission: {log.relatedSubmission.title || log.relatedSubmission.submission_id.slice(0, 8)}
                              </Link>
                            ),
                            log.relatedQCTORequest && (
                              <Link
                                key="r"
                                href={`/qcto/requests/${log.relatedQCTORequest.request_id}`}
                                className="text-xs text-primary hover:underline block truncate"
                              >
                                Request: {log.relatedQCTORequest.title || log.relatedQCTORequest.request_id.slice(0, 8)}
                              </Link>
                            ),
                          ].filter(Boolean)
                        : "—";

                    return (
                      <TableRow
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        className="group hover:bg-muted/50 transition-colors absolute left-0 top-0 w-full"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                          height: `${virtualRow.size}px`,
                        }}
                      >
                        <TableCell className="py-2 whitespace-nowrap w-12 text-foreground font-bold align-top">
                          {offset + index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs py-2 whitespace-nowrap w-[152px] text-muted-foreground">
                          {formatDate(log.changed_at)}
                        </TableCell>
                        <TableCell className="py-2 min-w-[180px]">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                  <div className="min-w-0 flex flex-col gap-0.5">
                                    <span className="font-semibold text-foreground truncate">{userLine1}</span>
                                    {userLine2 && (
                                      <span className="text-xs text-muted-foreground truncate">{userLine2}</span>
                                    )}
                                  </div>
                                  <span className="shrink-0 mt-0.5">{getRoleChip(log.role_at_time)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm text-xs whitespace-pre-wrap">
                                {userTooltip}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap">{getActionChip(log.change_type)}</TableCell>
                        <TableCell className="py-2 min-w-0">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <span className="block truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]">
                                  {formatEntityType(log.entity_type)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm text-xs break-all">
                                {`${formatEntityType(log.entity_type)}\nID: ${log.entity_id}`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-2 min-w-0">
                          <AuditCellWithTooltip value={formatFieldLabel(log.field_name)} maxWidth="max-w-[120px]" />
                        </TableCell>
                        <TableCell className="py-2 min-w-0 max-w-[260px]">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="min-w-0 break-words">
                                  <AuditLogDiffViewer
                                    oldValue={log.old_value}
                                    newValue={log.new_value}
                                    changeType={log.change_type}
                                    fieldName={log.field_name}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm text-xs whitespace-pre-wrap break-words">
                                {`From: ${formatValueForDisplay(log.old_value, log.field_name)}\nTo: ${formatValueForDisplay(log.new_value, log.field_name)}`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-2 min-w-0 max-w-[180px]" title={log.reason || "No reason provided"}>
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {log.reason || "No reason provided"}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 min-w-0 max-w-[160px]">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col gap-0.5 min-w-0 truncate overflow-hidden">
                                  {relatedCell === "—" ? (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  ) : (
                                    relatedCell
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm text-xs whitespace-pre-wrap">
                                {relatedTooltip}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-card border-l border-border group-hover:bg-muted/50 py-2 w-[88px] whitespace-nowrap align-top">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => setViewEntry(log)}
                                  aria-label="View audit entry"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">View audit entry</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Footer: Rows per page, Showing X–Y of Z, Prev / Next */}
            <footer className="border-t border-border px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-muted/30">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page</span>
                  <Select
                    value={String(limit)}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                    className="h-9 w-[72px]"
                  >
                    {ROWS_PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">Showing {showing} of {totalCount} audit log entries</p>
              </div>
              <div className="flex gap-2">
                {offset > 0 ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${basePath}?${paginationParams(Math.max(0, offset - limit))}`}>Previous</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                )}
                {offset + limit < totalCount ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${basePath}?${paginationParams(offset + limit)}`}>Next</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>Next</Button>
                )}
              </div>
            </footer>
          </div>
        )}

        {/* Footer when empty (no card) */}
        {logs.length === 0 && (
          <footer className="pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
                <Select
                  value={String(limit)}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                  className="h-9 w-[72px]"
                >
                  {ROWS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">Showing 0 of {totalCount} audit log entries</p>
            </div>
          </footer>
        )}
      </div>

      {/* View entry modal */}
      <AuditLogDetailModal
        entry={viewEntry}
        open={!!viewEntry}
        onOpenChange={(open) => !open && setViewEntry(null)}
      />
    </>
  );
}
