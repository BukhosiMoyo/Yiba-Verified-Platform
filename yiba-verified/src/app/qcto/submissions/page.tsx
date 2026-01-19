"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import Link from "next/link";
import { ExportButton } from "@/components/shared/ExportButton";
import { FileCheck, Eye, Search, X } from "lucide-react";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_submissions";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

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

function QctoSubmissionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          setPageSizeState(n);
        }
      }
    } catch (_) { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [searchQuery, statusFilter, offset, pageSize]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim().length >= 2) params.set("q", searchQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const res = await fetch(`/api/qcto/submissions?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to fetch submissions");
      }
      const data = await res.json();
      setSubmissions(data.items || []);
      setTotal(typeof data.count === "number" ? data.count : 0);
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setSubmissions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const pushURL = (q: string, status: string) => {
    const p = new URLSearchParams();
    if (q.trim().length >= 2) p.set("q", q.trim());
    if (status) p.set("status", status);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handleSearch = (v: string) => { setSearchQuery(v); setOffset(0); pushURL(v, statusFilter); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setOffset(0); pushURL(searchQuery, v); };
  const clearFilters = () => { setSearchQuery(""); setStatusFilter(""); setOffset(0); router.push("?", { scroll: false }); };
  const handlePageSizeChange = (n: number) => {
    setPageSizeState(n);
    setOffset(0);
    try { localStorage.setItem(PAGE_SIZE_KEY, String(n)); } catch (_) { /* ignore */ }
  };

  const formatDateTime = (d: Date | string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatStatus = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-800" },
      UNDER_REVIEW: { label: "Under Review", className: "bg-purple-100 text-purple-800" },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
      RETURNED_FOR_CORRECTION: { label: "Returned for Correction", className: "bg-orange-100 text-orange-800" },
    };
    return map[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  };

  const hasActiveFilters = searchQuery.trim().length >= 2 || statusFilter;

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Submissions</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Review institution submissions and compliance packs
          </p>
        </div>
        <ExportButton exportUrl="/api/export/submissions" className="w-full sm:w-auto" />
      </div>

      {/* Toolbar: search, status, clear */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              <option key={o.value || "_"} value={o.value}>{o.label}</option>
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
            {loading ? "Loading…" : `${total} submission${total !== 1 ? "s" : ""} found`}
            {statusFilter && !loading && ` with status "${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || statusFilter}"`}
          </p>
        </div>

        {error && (
          <div className="py-4 text-center text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <LoadingTable columns={9} rows={6} />
        ) : submissions.length === 0 ? (
          <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
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
              <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200">
                <TableHeader>
                  <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap w-12">#</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Institution</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Title</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Submitted</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Reviewed</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Resources</TableHead>
                    <TableHead className="sticky right-0 z-10 bg-gray-50 border-l border-gray-200 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s, index) => {
                    const statusInfo = formatStatus(s.status);
                    const resCount = s._count?.submissionResources ?? s.submissionResources?.length ?? 0;
                    return (
                      <TableRow key={s.submission_id} className="group hover:bg-sky-50/50 transition-colors duration-200">
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground w-12">{offset + index + 1}</TableCell>
                        <TableCell className="font-medium py-3 whitespace-nowrap">
                          {s.institution?.trading_name || s.institution?.legal_name || "—"}
                        </TableCell>
                        <TableCell className="py-3 max-w-[200px] truncate" title={s.title || "Untitled"}>{s.title || "Untitled"}</TableCell>
                        <TableCell className="py-3 whitespace-nowrap">{s.submission_type || "N/A"}</TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground">
                          {s.submitted_at ? formatDateTime(s.submitted_at) : "Not submitted"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground">
                          {s.reviewed_at ? formatDateTime(s.reviewed_at) : "Not reviewed"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">{resCount}</TableCell>
                        <TableCell className="sticky right-0 z-10 bg-white group-hover:bg-sky-50/50 border-l border-gray-200 py-3 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild className="h-7 min-w-0 px-2 text-xs gap-1">
                            <Link href={`/qcto/submissions/${s.submission_id}`}>
                              <Eye className="h-3 w-3" aria-hidden />
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

            {/* Footer: Rows per page + pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page</span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                  className="w-[70px]"
                >
                  {ROWS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - pageSize))}
                    disabled={offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + pageSize)}
                    disabled={offset + pageSize >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function QCTOSubmissionsPage() {
  return (
    <Suspense fallback={<LoadingTable columns={9} rows={6} />}>
      <QctoSubmissionsContent />
    </Suspense>
  );
}
