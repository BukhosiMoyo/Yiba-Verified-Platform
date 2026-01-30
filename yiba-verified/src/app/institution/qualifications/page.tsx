"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { Search, GraduationCap } from "lucide-react";

const PAGE_SIZE_KEY = "yv_table_page_size:institution_qualifications";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "RETIRED", label: "Retired" },
  { value: "DRAFT", label: "Draft" },
];

function formatStatus(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    RETIRED: { label: "Retired", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
    DRAFT: { label: "Draft", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  };
  return map[status] || { label: status, className: "bg-muted text-muted-foreground" };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InstitutionQualificationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Array<{
    id: string;
    name: string | null;
    saqa_id: string | null;
    curriculum_code: string | null;
    nqf_level: number | null;
    status: string;
    updated_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "ACTIVE");
  const [nqfFilter, setNqfFilter] = useState(searchParams.get("nqf_level") || "");
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get("page") || "1", 10)));

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          setPageSizeState(n);
        }
      }
    } catch (_) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (statusFilter) params.set("status", statusFilter);
    if (nqfFilter) params.set("nqf_level", nqfFilter);
    params.set("limit", String(pageSize));
    params.set("offset", String(offset));

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/institutions/qualifications?${params}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "Failed to fetch"); });
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "An error occurred");
          setItems([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchQuery, statusFilter, nqfFilter, page, pageSize]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set("q", value); else p.delete("q");
    p.delete("page");
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set("status", value); else p.delete("status");
    p.delete("page");
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handleNqfChange = (value: string) => {
    setNqfFilter(value);
    setPage(1);
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set("nqf_level", value); else p.delete("nqf_level");
    p.delete("page");
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSizeState(size);
    setPage(1);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch (_) {
      /* ignore */
    }
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Qualifications</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Browse the qualification registry (SAQA / curriculum / NQF). Select a row to view details.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, SAQA ID, curriculum code"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-[140px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "_"} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input
          placeholder="NQF level"
          className="w-24"
          value={nqfFilter}
          onChange={(e) => handleNqfChange(e.target.value)}
        />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Per page</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
            className="w-[80px]"
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <LoadingTable columns={6} rows={8} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No qualifications found"
          description={
            searchQuery || statusFilter || nqfFilter
              ? "Try adjusting filters."
              : "No qualifications match the current filters."
          }
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
          variant={searchQuery || statusFilter || nqfFilter ? "no-results" : "default"}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Qualification</TableHead>
                  <TableHead className="min-w-[100px]">SAQA ID</TableHead>
                  <TableHead className="min-w-[120px]">Curriculum code</TableHead>
                  <TableHead className="min-w-[70px]">NQF</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[110px]">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => {
                  const statusBadge = formatStatus(row.status);
                  return (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/institution/qualifications/${row.id}`)}
                    >
                      <TableCell className="font-medium">
                        <span className="block truncate max-w-[240px]">{row.name ?? "—"}</span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{row.saqa_id ?? "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{row.curriculum_code ?? "—"}</TableCell>
                      <TableCell>
                        {row.nqf_level != null ? `NQF ${row.nqf_level}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(row.updated_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    const p = new URLSearchParams(searchParams.toString());
                    if (page - 1 > 1) p.set("page", String(page - 1)); else p.delete("page");
                    router.push(`?${p.toString()}`, { scroll: false });
                  }}
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(page + 1));
                    router.push(`?${params.toString()}`, { scroll: false });
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
