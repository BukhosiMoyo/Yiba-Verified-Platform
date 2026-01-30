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
import { FileCheck, Eye, Search, X } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_submissions";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const PREFETCH_VIEW_ROWS = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "RETURNED_FOR_CORRECTION", label: "Returned for Correction" },
];

const PROVINCE_OPTIONS = [
  { value: "", label: "All provinces" },
  ...PROVINCES.map((p) => ({ value: p, label: p })),
];

type SubmissionRow = {
  submission_id: string;
  institution_id: string;
  title: string | null;
  submission_type: string | null;
  status: string;
  submitted_at: Date | string | null;
  reviewed_at: Date | string | null;
  institution: {
    institution_id: string;
    legal_name: string;
    trading_name: string | null;
  } | null;
  submittedByUser: {
    user_id: string;
    email: string | null;
    first_name: string;
    last_name: string;
  } | null;
  reviewedByUser: {
    user_id: string;
    email: string | null;
    first_name: string;
    last_name: string;
  } | null;
  submissionResources: Array<{
    resource_id: string;
    resource_type: string;
    resource_id_value: string;
    added_at: Date | string;
    notes: string | null;
  }>;
};

export interface QctoSubmissionsClientProps {
  submissions: SubmissionRow[];
  total: number;
  initialQ: string;
  initialStatus: string;
  initialProvince: string;
  limit: number;
  offset: number;
}

function formatDateTime(d: Date | string | null) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
    PENDING: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    },
    SUBMITTED: {
      label: "Submitted",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    },
    APPROVED: {
      label: "Approved",
      className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    },
    RETURNED_FOR_CORRECTION: {
      label: "Returned for Correction",
      className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    },
  };
  return map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
}

export function QctoSubmissionsClient({
  submissions,
  total,
  initialQ,
  initialStatus,
  initialProvince,
  limit,
  offset,
}: QctoSubmissionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [provinceFilter, setProvinceFilter] = useState(initialProvince);

  useEffect(() => {
    setSearchQuery(initialQ);
    setStatusFilter(initialStatus);
    setProvinceFilter(initialProvince);
  }, [initialQ, initialStatus, initialProvince]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          /* use for default */
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
    const toPrefetch = submissions
      .slice(0, PREFETCH_VIEW_ROWS)
      .map((s) => `/qcto/submissions/${s.submission_id}`);
    toPrefetch.forEach((path) => router.prefetch(path));
  }, [router, submissions]);

  const buildParams = (updates: {
    q?: string;
    status?: string;
    province?: string;
    limit?: number;
    offset?: number;
  }) => {
    const p = new URLSearchParams(searchParams.toString());
    const qq = updates.q !== undefined ? updates.q : initialQ;
    const s = updates.status !== undefined ? updates.status : initialStatus;
    const pr = updates.province !== undefined ? updates.province : initialProvince;
    const lim = updates.limit ?? limit;
    const off = updates.offset ?? offset;
    if (qq && qq.trim().length >= 2) p.set("q", qq.trim());
    else p.delete("q");
    if (s) p.set("status", s);
    else p.delete("status");
    if (pr) p.set("province", pr);
    else p.delete("province");
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

  const handleProvinceFilter = (v: string) => {
    setProvinceFilter(v);
    router.push(`?${buildParams({ province: v, offset: 0 })}`, { scroll: false });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setProvinceFilter("");
    router.push(`?${buildParams({ q: "", status: "", province: "", offset: 0 })}`, {
      scroll: false,
    });
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

  const hasActiveFilters =
    initialQ.trim().length >= 2 || !!initialStatus || !!initialProvince;
  const queryString = buildParams({});

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            Submissions
            {initialStatus && (
              <span
                className={`inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-semibold ${formatStatus(initialStatus).className}`}
              >
                {formatStatus(initialStatus).label}
              </span>
            )}
            {initialProvince && (
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
                {initialProvince}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Review institution submissions and compliance packs
          </p>
        </div>
        <ExportButton
          exportUrl={`/api/export/submissions?${queryString}`}
          className="w-full sm:w-auto"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search submissions"
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
          <Select
            value={provinceFilter}
            onChange={(e) => handleProvinceFilter(e.target.value)}
            className="w-[180px]"
          >
            {PROVINCE_OPTIONS.map((o) => (
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
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Submissions</h2>
          <p className="text-sm text-muted-foreground">
            {total} submission{total !== 1 ? "s" : ""} found
            {initialStatus &&
              ` with status "${STATUS_OPTIONS.find((o) => o.value === initialStatus)?.label ?? initialStatus}"`}
            {initialProvince && ` in ${initialProvince}`}
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <div className="py-12">
              <EmptyState
                title={hasActiveFilters ? "No submissions found" : "No submissions yet"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your filters or search."
                    : "Submissions from institutions will appear here once they submit compliance packs for QCTO review."
                }
                icon={<FileCheck className="h-6 w-6" strokeWidth={1.5} />}
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
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap w-12">#</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Institution</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Title</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Submitted</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Reviewed</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">Resources</TableHead>
                    <TableHead className="sticky right-0 z-10 bg-muted/40 border-l border-border text-[11px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s, index) => {
                    const statusInfo = formatStatus(s.status);
                    const inst = s.institution;
                    const resCount = s.submissionResources?.length ?? 0;
                    return (
                      <TableRow
                        key={s.submission_id}
                        className="group hover:bg-accent/50 transition-colors"
                      >
                        <TableCell className="py-3 whitespace-nowrap w-12 font-bold text-foreground">
                          {offset + index + 1}
                        </TableCell>
                        <TableCell className="font-medium py-3 whitespace-nowrap">
                          {inst?.trading_name || inst?.legal_name || "—"}
                        </TableCell>
                        <TableCell
                          className="py-3 max-w-[200px] truncate"
                          title={s.title || "Untitled"}
                        >
                          {s.title || "Untitled"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground text-sm">
                          {s.submission_type || "N/A"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground text-sm">
                          {formatDateTime(s.submitted_at)}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground text-sm">
                          {s.reviewed_at
                            ? formatDateTime(s.reviewed_at)
                            : "Not reviewed"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">{resCount}</TableCell>
                        <TableCell className="sticky right-0 z-10 bg-card border-l border-border group-hover:bg-accent/50 py-3 whitespace-nowrap text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/qcto/submissions/${s.submission_id}`}
                              onMouseEnter={prefetchView(`/qcto/submissions/${s.submission_id}`)}
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
