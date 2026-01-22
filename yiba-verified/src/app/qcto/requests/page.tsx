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
import { FileQuestion, Eye, Search, X } from "lucide-react";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_requests";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function QctoRequestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isYourRequestsOnly, setIsYourRequestsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    document.title = "QCTO Requests | Yiba Verified";
  }, []);

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

  // Sync URL (status, q) into filter state when navigating via nav dropdown, back/forward, or shared link
  useEffect(() => {
    const s = searchParams.get("status") || "";
    const q = searchParams.get("q") || "";
    setStatusFilter(s);
    setSearchQuery(q);
    setOffset(0);
  }, [searchParams]);

  useEffect(() => {
    fetchRequests();
  }, [searchQuery, statusFilter, offset, pageSize]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim().length >= 2) params.set("q", searchQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const res = await fetch(`/api/qcto/requests?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to fetch requests");
      }
      const data = await res.json();
      setRequests(data.items || []);
      setTotal(typeof data.count === "number" ? data.count : 0);
      setIsYourRequestsOnly(data.meta?.isYourRequestsOnly === true);
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setRequests([]);
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

  const formatDate = (d: Date | string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const formatDateTime = (d: Date | string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatStatus = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
    };
    return map[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  };

  const hasActiveFilters = searchQuery.trim().length >= 2 || statusFilter;

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            QCTO Requests
            {statusFilter && (
              <span
                className={`inline-flex items-center rounded-full border border-gray-200/80 px-3 py-1 text-sm font-semibold shadow-sm ${formatStatus(statusFilter).className}`}
              >
                {formatStatus(statusFilter).label}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage requests for access to institution resources
          </p>
        </div>
        <ExportButton
          exportUrl="/api/export/qcto-requests"
          className="w-full sm:w-auto border-gray-300 text-gray-800 bg-white hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow"
        />
      </div>

      {/* Toolbar: search, status, clear */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search requests"
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
          <h2 className="text-lg font-semibold">All Requests</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} request${total !== 1 ? "s" : ""} found`}
            {statusFilter && !loading && ` with status "${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || statusFilter}"`}
            {isYourRequestsOnly && !loading && " (your requests)"}
          </p>
        </div>

        {error && (
          <div className="py-4 text-center text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <LoadingTable columns={9} rows={6} />
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
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
              <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200">
                <TableHeader>
                  <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap w-12">#</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Institution</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Title</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Type</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Requested</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Reviewed</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Expires</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Resources</TableHead>
                    <TableHead className="sticky right-0 z-10 bg-gray-50 border-l border-gray-200 text-[11px] font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r, index) => {
                    const statusInfo = formatStatus(r.status);
                    const isExpired = r.expires_at && new Date(r.expires_at) < new Date();
                    const resCount = r._count?.requestResources ?? 0;
                    const inst = r.institution;
                    return (
                      <TableRow key={r.request_id} className="group hover:bg-sky-50/50 transition-colors duration-200">
                        <TableCell className="py-3 whitespace-nowrap text-gray-800 w-12 font-bold">{offset + index + 1}</TableCell>
                        <TableCell className="font-medium py-3 whitespace-nowrap">
                          {inst?.trading_name || inst?.legal_name || "—"}
                          {inst?.registration_number && (
                            <span className="text-xs text-muted-foreground ml-1">({inst.registration_number})</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 max-w-[200px] truncate" title={r.title || "Untitled"}>{r.title || "Untitled"}</TableCell>
                        <TableCell className="py-3 whitespace-nowrap">{r.request_type || "N/A"}</TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(r.requested_at)}</TableCell>
                        <TableCell className="py-3 whitespace-nowrap text-muted-foreground">
                          {r.reviewed_at ? formatDateTime(r.reviewed_at) : "Not reviewed"}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          {r.expires_at ? (
                            <span className={isExpired ? "text-red-600" : ""}>
                              {formatDate(r.expires_at)}
                              {isExpired && " (Expired)"}
                            </span>
                          ) : (
                            "No expiry"
                          )}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">{resCount}</TableCell>
                        <TableCell className="sticky right-0 z-10 bg-white group-hover:bg-sky-50/50 border-l border-gray-200 py-3 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild className="h-6 min-w-0 px-1.5 text-[11px] gap-1 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400">
                            <Link href={`/qcto/requests/${r.request_id}`}>
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

export default function QCTORequestsPage() {
  return (
    <Suspense fallback={<LoadingTable columns={10} rows={6} />}>
      <QctoRequestsContent />
    </Suspense>
  );
}
