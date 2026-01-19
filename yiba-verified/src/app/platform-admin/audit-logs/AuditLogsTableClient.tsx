"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AuditLogDiffViewer } from "@/components/platform-admin/AuditLogDiffViewer";
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

const CHIP_BASE = "text-xs px-2 py-0.5 rounded-full border shrink-0";
function getRoleChip(role: string) {
  const label = role.replace(/_/g, " ");
  const R: Record<string, string> = {
    PLATFORM_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
    QCTO_USER: "bg-purple-100 text-purple-800 border-purple-200",
    INSTITUTION_ADMIN: "bg-indigo-100 text-indigo-800 border-indigo-200",
    INSTITUTION_STAFF: "bg-slate-100 text-slate-700 border-slate-200",
    STUDENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <span className={`${CHIP_BASE} ${R[role] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {label}
    </span>
  );
}
function getActionChip(changeType: string) {
  const T: Record<string, { label: string; c: string }> = {
    CREATE: { label: "Created", c: "bg-blue-100 text-blue-800 border-blue-200" },
    UPDATE: { label: "Updated", c: "bg-amber-100 text-amber-800 border-amber-200" },
    STATUS_CHANGE: { label: "Status changed", c: "bg-amber-100 text-amber-800 border-amber-200" },
    DELETE: { label: "Deleted", c: "bg-red-100 text-red-800 border-red-200" },
  };
  const t = T[changeType] ?? { label: changeType, c: "bg-slate-100 text-slate-600 border-slate-200" };
  return <span className={`${CHIP_BASE} ${t.c}`}>{t.label}</span>;
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
            title={hasActiveFilters ? "No results" : "No audit entries yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters."
                : "When changes happen in the system, they'll appear here."
            }
            icon={<ClipboardList className="h-6 w-6" strokeWidth={1.5} />}
            variant={hasActiveFilters ? "no-results" : "default"}
          />
        ) : (
          <div className="w-full min-w-0 rounded-2xl border border-gray-200/60 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200">
                <TableHeader>
                  <TableRow className="hover:bg-gray-100 border-b border-gray-200">
                    <TableHead className="sticky left-0 top-0 z-20 bg-gray-100 border-r border-gray-200 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5 w-12">
                      #
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      Timestamp
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      User
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      Action
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      Entity
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      Field
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      Change
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      Reason
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5">
                      Related
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-gray-100 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap py-2.5 w-12">
                      View
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => {
                    const userLabel =
                      log.changedBy?.first_name && log.changedBy?.last_name
                        ? `${log.changedBy.first_name} ${log.changedBy.last_name}`
                        : log.changedBy?.email || log.changed_by || "—";
                    const userTooltip = [userLabel, log.changedBy?.email || log.changed_by].filter(Boolean).join("\n") || "—";
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
                      <TableRow key={log.audit_id} className="group hover:bg-gray-50/50 even:bg-muted/20">
                        <TableCell className="sticky left-0 z-10 bg-white border-r border-gray-200 group-hover:bg-gray-50/50 py-2 whitespace-nowrap text-muted-foreground w-12">
                          {offset + index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs py-2 whitespace-nowrap">
                          {formatDate(log.changed_at)}
                        </TableCell>
                        <TableCell className="py-2 min-w-0">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col gap-0.5 min-w-0 max-w-[180px]">
                                  <span className="font-medium truncate">{userLabel}</span>
                                  {getRoleChip(log.role_at_time)}
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
                          <AuditCellWithTooltip value={log.field_name ?? "—"} maxWidth="max-w-[120px]" />
                        </TableCell>
                        <TableCell className="py-2 min-w-0 max-w-[240px]">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="min-w-0 truncate">
                                  <AuditLogDiffViewer
                                    oldValue={log.old_value}
                                    newValue={log.new_value}
                                    changeType={log.change_type}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm text-xs whitespace-pre-wrap break-words">
                                {`Old: ${formatValue(log.old_value)}\n\nNew: ${formatValue(log.new_value)}`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-2 min-w-0 max-w-[160px]">
                          <AuditCellWithTooltip value={log.reason || "No reason provided"} maxWidth="max-w-[160px]" />
                        </TableCell>
                        <TableCell className="py-2 min-w-0 max-w-[160px]">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col gap-0.5 min-w-0 truncate">
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
                        <TableCell className="py-2 w-12 whitespace-nowrap">
                          <TooltipProvider>
                            <Tooltip delayDuration={200}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => setViewEntry(log)}
                                  aria-label="View entry"
                                >
                                  <Eye className="h-4 w-4 text-gray-700" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">View entry</TooltipContent>
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
            <footer className="border-t border-gray-200/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-gray-50/30">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rows per page</span>
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
                <span className="text-sm text-gray-500">Rows per page</span>
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

      {/* View entry drawer */}
      <Sheet open={!!viewEntry} onOpenChange={(open) => !open && setViewEntry(null)}>
        <SheetContent side="right" className="flex flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Audit entry</SheetTitle>
            <SheetDescription>Full change details and metadata</SheetDescription>
          </SheetHeader>
          {viewEntry && (
            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-2">
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Timestamp</p>
                <p className="text-sm font-mono mt-0.5">{formatDate(viewEntry.changed_at)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">User</p>
                <p className="text-sm mt-0.5">
                  {viewEntry.changedBy?.first_name && viewEntry.changedBy?.last_name
                    ? `${viewEntry.changedBy.first_name} ${viewEntry.changedBy.last_name}`
                    : viewEntry.changedBy?.email || viewEntry.changed_by || "—"}
                </p>
                <p className="text-xs text-muted-foreground">{viewEntry.changedBy?.email || viewEntry.changed_by || "—"}</p>
                <Badge variant="outline" className="mt-1 text-xs">{viewEntry.role_at_time.replace("_", " ")}</Badge>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Action</p>
                <Badge variant={formatChangeType(viewEntry.change_type).variant} className="mt-0.5">
                  {formatChangeType(viewEntry.change_type).label}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Entity</p>
                <p className="text-sm mt-0.5">{formatEntityType(viewEntry.entity_type)}</p>
                <p className="text-xs font-mono text-muted-foreground break-all">{viewEntry.entity_id}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Field</p>
                <p className="text-sm font-mono mt-0.5">{viewEntry.field_name ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Change (full payload)</p>
                <div className="mt-1.5 rounded-lg border border-gray-200/60 bg-gray-50/50 p-3 max-h-64 overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {`Old: ${formatValue(viewEntry.old_value)}\n\nNew: ${formatValue(viewEntry.new_value)}`}
                  </pre>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Reason</p>
                <p className="text-sm mt-0.5">{viewEntry.reason || "No reason provided"}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Related</p>
                <div className="mt-1.5 space-y-1.5">
                  {viewEntry.institution && (
                    <Link
                      href={`${institutionsPath}/${viewEntry.institution.institution_id}`}
                      className="block text-sm text-primary hover:underline"
                    >
                      Institution: {viewEntry.institution.trading_name || viewEntry.institution.legal_name}
                    </Link>
                  )}
                  {viewEntry.relatedSubmission && (
                    <Link
                      href={`${submissionsPath}/${viewEntry.relatedSubmission.submission_id}`}
                      className="block text-sm text-primary hover:underline"
                    >
                      Submission: {viewEntry.relatedSubmission.title || viewEntry.relatedSubmission.submission_id}
                    </Link>
                  )}
                  {viewEntry.relatedQCTORequest && (
                    <Link
                      href={`/qcto/requests/${viewEntry.relatedQCTORequest.request_id}`}
                      className="block text-sm text-primary hover:underline"
                    >
                      Request: {viewEntry.relatedQCTORequest.title || viewEntry.relatedQCTORequest.request_id}
                    </Link>
                  )}
                  {!viewEntry.institution && !viewEntry.relatedSubmission && !viewEntry.relatedQCTORequest && (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
