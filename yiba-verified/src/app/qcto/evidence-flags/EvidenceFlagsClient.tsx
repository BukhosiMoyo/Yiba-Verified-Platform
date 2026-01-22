"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EvidenceFlagsToolbar } from "@/components/qcto/EvidenceFlagsToolbar";
import { EvidenceFlagsDisplay } from "@/components/qcto/EvidenceFlagsDisplay";
import { ExportButton } from "@/components/shared/ExportButton";
import { Flag } from "lucide-react";
import type { Role } from "@/lib/rbac";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_evidence_flags";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

type ViewMode = "list" | "grid";

function EvidenceFlagsContent({ userRole }: { userRole: Role }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [flags, setFlags] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [view, setView] = useState<ViewMode>((searchParams.get("view") === "grid" ? "grid" : "list") as ViewMode);
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
    const q = searchParams.get("q") || "";
    const s = searchParams.get("status") || "";
    const v = (searchParams.get("view") === "grid" ? "grid" : "list") as ViewMode;
    setSearchQuery(q);
    setStatusFilter(s);
    setView(v);
    setOffset(0);
  }, [searchParams]);

  useEffect(() => {
    fetchFlags();
  }, [searchQuery, statusFilter, offset, pageSize]);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const res = await fetch(`/api/qcto/evidence-flags?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to fetch evidence flags");
      }
      const data = await res.json();
      setFlags(data.items || []);
      setTotal(typeof data.count === "number" ? data.count : 0);
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setFlags([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const pushURL = (q: string, status: string, v?: ViewMode) => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    if (v) p.set("view", v);
    else p.set("view", view);
    router.push(`/qcto/evidence-flags?${p.toString()}`, { scroll: false });
  };

  const handleQChange = (v: string) => { setSearchQuery(v); setOffset(0); pushURL(v, statusFilter); };
  const handleStatusChange = (v: string) => { setStatusFilter(v); setOffset(0); pushURL(searchQuery, v); };
  const clearFilters = () => { setSearchQuery(""); setStatusFilter(""); setOffset(0); router.push(`/qcto/evidence-flags?view=${view}`, { scroll: false }); };
  const handlePageSizeChange = (n: number) => {
    setPageSizeState(n);
    setOffset(0);
    try { localStorage.setItem(PAGE_SIZE_KEY, String(n)); } catch (_) { /* ignore */ }
  };

  const hasActiveFilters = !!searchQuery.trim() || !!statusFilter;

  const statusPill =
    statusFilter === "ACTIVE" ? "bg-amber-100 text-amber-800" :
    statusFilter === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "";

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            Evidence Flags
            {statusFilter && statusPill && (
              <span className={`inline-flex items-center rounded-full border border-gray-200/80 px-3 py-1 text-sm font-semibold shadow-sm ${statusPill}`}>
                {statusFilter === "ACTIVE" ? "Active" : "Resolved"}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Documents flagged by QCTO for review or follow-up
          </p>
        </div>
        <ExportButton
          exportUrl={statusFilter ? `/api/export/evidence-flags?status=${encodeURIComponent(statusFilter)}` : "/api/export/evidence-flags"}
          className="w-full sm:w-auto"
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Flags</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} flag${total !== 1 ? "s" : ""} found`}
            {statusFilter && !loading && ` with status "${statusFilter === "ACTIVE" ? "Active" : "Resolved"}"`}
            {searchQuery.trim() && !loading && ` matching "${searchQuery}"`}
          </p>
        </div>

        <EvidenceFlagsToolbar
          q={searchQuery}
          status={statusFilter}
          view={view}
          onQChange={handleQChange}
          onStatusChange={handleStatusChange}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {error && (
          <div className="py-4 text-center text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <LoadingTable columns={9} rows={6} />
        ) : flags.length === 0 ? (
          <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
            <div className="py-12">
              <EmptyState
                title="No evidence flags"
                description={hasActiveFilters ? "Try adjusting your filters or search." : "Documents flagged for review will appear here."}
                icon={<Flag className="h-6 w-6" strokeWidth={1.5} />}
                variant={hasActiveFilters ? "no-results" : "default"}
              />
            </div>
          </div>
        ) : (
          <>
            <EvidenceFlagsDisplay view={view} flags={flags} userRole={userRole} offset={view === "list" ? offset : 0} />

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

export function EvidenceFlagsClient({ userRole }: { userRole: Role }) {
  return (
    <Suspense fallback={<LoadingTable columns={9} rows={6} />}>
      <EvidenceFlagsContent userRole={userRole} />
    </Suspense>
  );
}
