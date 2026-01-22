"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import Link from "next/link";
import { FileCheck, Eye, Search, X } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_readiness";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "RETURNED_FOR_CORRECTION", label: "Returned for Correction" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "RECOMMENDED", label: "Recommended" },
  { value: "REJECTED", label: "Rejected" },
];

const PROVINCE_OPTIONS = [
  { value: "", label: "All provinces" },
  ...PROVINCES.map((p) => ({ value: p, label: p })),
];

function formatStatus(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    NOT_STARTED: { label: "Not Started", className: "bg-gray-100 text-gray-800" },
    IN_PROGRESS: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
    SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-800" },
    UNDER_REVIEW: { label: "Under Review", className: "bg-purple-100 text-purple-800" },
    RETURNED_FOR_CORRECTION: { label: "Returned", className: "bg-orange-100 text-orange-800" },
    REVIEWED: { label: "Reviewed", className: "bg-blue-100 text-blue-800" },
    RECOMMENDED: { label: "Recommended", className: "bg-green-100 text-green-800" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  };
  return map[status] || { label: status, className: "bg-gray-100 text-gray-800" };
}

function QctoReadinessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [provinceFilter, setProvinceFilter] = useState(searchParams.get("province") || "");
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
    const s = searchParams.get("status") || "";
    const q = searchParams.get("q") || "";
    const p = searchParams.get("province") || "";
    setStatusFilter(s);
    setSearchQuery(q);
    setProvinceFilter(p);
    setOffset(0);
  }, [searchParams]);

  useEffect(() => {
    fetchRecords();
  }, [searchQuery, statusFilter, provinceFilter, offset, pageSize]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim().length >= 2) params.set("q", searchQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (provinceFilter) params.set("province", provinceFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const res = await fetch(`/api/qcto/readiness?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to fetch readiness records");
      }
      const data = await res.json();
      setRecords(data.items || []);
      setTotal(typeof data.count === "number" ? data.count : 0);
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const pushURL = (q: string, status: string, province: string) => {
    const p = new URLSearchParams();
    if (q.trim().length >= 2) p.set("q", q.trim());
    if (status) p.set("status", status);
    if (province) p.set("province", province);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handleSearch = (v: string) => { setSearchQuery(v); setOffset(0); pushURL(v, statusFilter, provinceFilter); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setOffset(0); pushURL(searchQuery, v, provinceFilter); };
  const handleProvinceFilter = (v: string) => { setProvinceFilter(v); setOffset(0); pushURL(searchQuery, statusFilter, v); };
  const clearFilters = () => { setSearchQuery(""); setStatusFilter(""); setProvinceFilter(""); setOffset(0); router.push("?", { scroll: false }); };
  const handlePageSizeChange = (n: number) => {
    setPageSizeState(n);
    setOffset(0);
    try { localStorage.setItem(PAGE_SIZE_KEY, String(n)); } catch (_) { /* ignore */ }
  };

  const hasActiveFilters = searchQuery.trim().length >= 2 || statusFilter || provinceFilter;

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            Form 5 Readiness Records
            {statusFilter && (
              <span
                className={`inline-flex items-center rounded-full border border-gray-200/80 px-3 py-1 text-sm font-semibold shadow-sm ${formatStatus(statusFilter).className}`}
              >
                {formatStatus(statusFilter).label}
              </span>
            )}
            {provinceFilter && (
              <span className="inline-flex items-center rounded-full border border-gray-200/80 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800 shadow-sm">
                {provinceFilter}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Review institution readiness records for programme delivery
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search qualification, SAQA ID, institution"
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
          <Select
            value={provinceFilter}
            onChange={(e) => handleProvinceFilter(e.target.value)}
            className="w-[180px]"
          >
            {PROVINCE_OPTIONS.map((o) => (
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
          <h2 className="text-lg font-semibold">All Readiness Records</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} record${total !== 1 ? "s" : ""} found`}
            {statusFilter && !loading && ` with status "${formatStatus(statusFilter).label}"`}
            {provinceFilter && !loading && ` in ${provinceFilter}`}
          </p>
        </div>

        {error && (
          <div className="py-4 text-center text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <LoadingTable columns={10} rows={6} />
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
            <div className="py-12">
              <EmptyState
                title={hasActiveFilters ? "No readiness records found" : "No readiness records yet"}
                description={
                  hasActiveFilters
                    ? "Try adjusting your filters or search."
                    : "Form 5 readiness records from institutions will appear here once they are submitted for QCTO review."
                }
                icon={<FileCheck className="h-6 w-6" strokeWidth={1.5} />}
                variant={hasActiveFilters ? "no-results" : "default"}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200/60 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-border [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-border">
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 dark:bg-muted/50 border-b border-gray-200 dark:border-border hover:bg-gray-50/80 dark:hover:bg-muted/50">
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap w-12 text-center py-2.5 px-4">#</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">Qualification</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">SAQA ID</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">Institution</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">NQF Level</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">Delivery</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">Status</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">Docs</TableHead>
                      <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap py-2.5 px-4">Recommendation</TableHead>
                      <TableHead className="sticky right-0 z-10 bg-gray-50/80 dark:bg-muted/50 border-l border-gray-200 dark:border-border text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground whitespace-nowrap text-right py-2.5 px-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r, index) => {
                      const statusInfo = formatStatus(r.readiness_status);
                      const docCount = r._count?.documents ?? 0;
                      return (
                        <TableRow key={r.readiness_id} className="group hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-colors">
                          <TableCell className="py-2.5 px-4 text-center tabular-nums font-semibold text-gray-700 dark:text-muted-foreground w-12">{offset + index + 1}</TableCell>
                        <TableCell className="font-medium py-2.5 px-4 max-w-[200px] truncate" title={r.qualification_title || "Untitled"}>{r.qualification_title || "Untitled"}</TableCell>
                        <TableCell className="py-2.5 px-4 whitespace-nowrap font-mono text-sm">{r.saqa_id || "N/A"}</TableCell>
                        <TableCell className="py-2.5 px-4 whitespace-nowrap">{r.institution?.trading_name || r.institution?.legal_name || "—"}</TableCell>
                        <TableCell className="py-2.5 px-4 whitespace-nowrap">{r.nqf_level ? `NQF ${r.nqf_level}` : "N/A"}</TableCell>
                        <TableCell className="py-2.5 px-4 whitespace-nowrap">{r.delivery_mode ? r.delivery_mode.replace(/_/g, " ") : "N/A"}</TableCell>
                        <TableCell className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                        </TableCell>
                        <TableCell className="py-2.5 px-4 whitespace-nowrap">{docCount}</TableCell>
                        <TableCell className="py-2.5 px-4 whitespace-nowrap">
                          {r.recommendation ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{r.recommendation.recommendation}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-white dark:bg-card group-hover:bg-sky-50/50 dark:group-hover:bg-sky-950/20 border-l border-gray-200 dark:border-border py-2.5 px-4 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild className="h-6 min-w-0 px-1.5 text-[11px] gap-1 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400">
                            <Link href={`/qcto/readiness/${r.readiness_id}`}>
                              <Eye className="h-3 w-3" aria-hidden />
                              Review
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              </div>
            </div>

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

export default function QCTOReadinessPage() {
  return (
    <Suspense fallback={<LoadingTable columns={10} rows={6} />}>
      <QctoReadinessContent />
    </Suspense>
  );
}
