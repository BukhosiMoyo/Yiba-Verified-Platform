"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { ExportButton } from "@/components/shared/ExportButton";
import { FileQuestion, Eye, Search, X, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_requests";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const PREFETCH_VIEW_ROWS = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent / Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "RETURNED_FOR_CORRECTION", label: "Returned" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export type RequestRow = {
  request_id: string;
  reference_code: string | null;
  institution_id: string;
  title: string;
  type: string;
  status: string;
  requested_at: Date | string | null;
  due_at: Date | string | null;
  reviewed_at: Date | string | null;
  institution: {
    institution_id: string;
    legal_name: string;
    trading_name: string | null;
    registration_number: string;
  } | null;
  _count: { evidenceLinks: number };
};

export interface QctoRequestsClientProps {
  requests: RequestRow[];
  total: number;
  isYourRequestsOnly: boolean;
  initialQ: string;
  initialStatus: string;
  limit: number;
  offset: number;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStatus(status: string) {
  switch (status) {
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "RETURNED_FOR_CORRECTION":
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">Returned</Badge>;
    case "SUBMITTED":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">Submitted</Badge>;
    case "UNDER_REVIEW":
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">Reviewing</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400">In Progress</Badge>;
    case "SENT":
    case "PENDING":
      return <Badge variant="outline" className="text-muted-foreground">Sent</Badge>;
    case "DRAFT":
      return <Badge variant="outline">Draft</Badge>;
    case "CANCELLED":
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

export function QctoRequestsClient({
  requests,
  total,
  isYourRequestsOnly,
  initialQ,
  initialStatus,
  limit,
  offset,
}: QctoRequestsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  useEffect(() => {
    setSearchQuery(initialQ);
    setStatusFilter(initialStatus);
  }, [initialQ, initialStatus]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          // Page size from localStorage; URL takes precedence
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const prefetchView = (path: string) => () => {
    if (path?.startsWith("/")) router.prefetch(path);
  };

  useEffect(() => {
    const toPrefetch = requests
      .slice(0, PREFETCH_VIEW_ROWS)
      .map((r) => `/qcto/requests/${r.request_id}`);
    toPrefetch.forEach((path) => router.prefetch(path));
  }, [router, requests]);

  const buildParams = (updates: {
    q?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const p = new URLSearchParams(searchParams.toString());
    const qq = updates.q !== undefined ? updates.q : initialQ;
    const s = updates.status !== undefined ? updates.status : initialStatus;
    const lim = updates.limit ?? limit;
    const off = updates.offset ?? offset;
    if (qq && qq.trim().length >= 2) p.set("q", qq.trim());
    else p.delete("q");
    if (s) p.set("status", s);
    else p.delete("status");
    p.set("limit", String(lim));
    p.set("offset", String(off));
    return p.toString();
  };

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    router.push(`?${buildParams({ q: v, offset: 0 })}`, { scroll: false });
  };

  const handleStatusFilter = (v: string) => {
    setStatusFilter(v);
    router.push(`?${buildParams({ status: v, offset: 0 })}`, { scroll: false });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    router.push(`?${buildParams({ q: "", status: "", offset: 0 })}`, { scroll: false });
  };

  const handlePageSizeChange = (size: number) => {
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch {
      /* ignore */
    }
    router.push(`?${buildParams({ limit: size, offset: 0 })}`, { scroll: false });
  };

  const goPrev = () => {
    const nextOffset = Math.max(0, offset - limit);
    router.push(`?${buildParams({ offset: nextOffset })}`, { scroll: false });
  };

  const goNext = () => {
    if (offset + limit >= total) return;
    router.push(`?${buildParams({ offset: offset + limit })}`, { scroll: false });
  };

  const hasActiveFilters = initialQ.trim().length >= 2 || !!initialStatus;
  const queryString = buildParams({});

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reference or institution"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="w-[180px]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "_"} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <ExportButton
          exportUrl={`/api/export/qcto-requests?${queryString}`}
          className="w-full sm:w-auto"
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Requests</h2>
          <p className="text-sm text-muted-foreground">
            {total} request{total !== 1 ? "s" : ""} found
            {initialStatus && ` with status "${STATUS_OPTIONS.find((o) => o.value === initialStatus)?.label ?? initialStatus}"`}
            {isYourRequestsOnly && " (your requests)"}
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <div className="py-12">
              <EmptyState
                title={hasActiveFilters ? "No requests found" : "No requests yet"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your filters or search."
                    : "Create requests from an institution's page to request access to their resources."
                }
                icon={<FileQuestion className="h-6 w-6" strokeWidth={1.5} />}
                variant={hasActiveFilters ? "no-results" : "default"}
              />
            </div>
          </div>
        ) : (
          <>
            <ResponsiveTable>
              <Table className="border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap w-24">Ref</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Institution</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Title</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Due Date</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Evidence</TableHead>
                    <TableHead className="sticky right-0 z-10 bg-muted/40 border-l border-border text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r, index) => {
                    const isOverdue =
                      r.due_at &&
                      new Date(r.due_at) < new Date() &&
                      !["APPROVED", "REJECTED", "CANCELLED", "SUBMITTED", "UNDER_REVIEW"].includes(r.status);

                    const evidenceCount = r._count?.evidenceLinks ?? 0;
                    const inst = r.institution;

                    return (
                      <TableRow
                        key={r.request_id}
                        className="group hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {r.reference_code || "—"}
                        </TableCell>
                        <TableCell className="font-medium py-3 whitespace-nowrap">
                          {inst?.trading_name || inst?.legal_name || "—"}
                          {inst?.registration_number && (
                            <div className="text-xs text-muted-foreground">
                              {inst.registration_number}
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className="py-3 max-w-[200px] truncate"
                          title={r.title || "Untitled"}
                        >
                          {r.title || "Untitled"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-xs">
                          {formatType(r.type)}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          {formatStatus(r.status)}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-sm">
                          {r.due_at ? (
                            <span
                              className={
                                isOverdue
                                  ? "text-destructive flex items-center font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {isOverdue && <AlertCircle className="w-3 h-3 mr-1" />}
                              {formatDate(r.due_at)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">No deadline</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-center">
                          {evidenceCount > 0 ? (
                            <Badge variant="secondary" className="font-normal">
                              {evidenceCount} item{evidenceCount !== 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-card border-l border-border group-hover:bg-accent/50 py-3 whitespace-nowrap text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/qcto/requests/${r.request_id}`}
                              onMouseEnter={prefetchView(`/qcto/requests/${r.request_id}`)}
                            >
                              <Eye className="h-3 w-3 mr-1" aria-hidden />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ResponsiveTable>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
                <Select
                  value={String(limit)}
                  onChange={(e) =>
                    handlePageSizeChange(parseInt(e.target.value, 10))
                  }
                  className="w-[70px]"
                >
                  {ROWS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of{" "}
                  {total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goPrev}
                    disabled={offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goNext}
                    disabled={offset + limit >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
