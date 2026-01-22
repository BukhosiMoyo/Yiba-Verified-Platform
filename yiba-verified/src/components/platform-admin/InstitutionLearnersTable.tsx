"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { GraduationCap, Eye, Search } from "lucide-react";
import Link from "next/link";

const ROWS_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_LIMIT = 10;
const DEBOUNCE_MS = 300;

type Learner = {
  learner_id: string;
  national_id: string;
  alternate_id: string | null;
  first_name: string;
  last_name: string;
  created_at: string;
  user_id: string | null;
  user: { email: string | null } | null;
};

export function InstitutionLearnersTable({ institutionId }: { institutionId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Learner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limitParam = searchParams.get("limit") || String(DEFAULT_LIMIT);
  const limit = ROWS_OPTIONS.includes(parseInt(limitParam, 10) as (typeof ROWS_OPTIONS)[number])
    ? parseInt(limitParam, 10)
    : DEFAULT_LIMIT;
  const q = searchParams.get("q") || "";

  // Sync search input from URL when q changes (e.g. back/forward)
  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams.get("q")]);

  const applySearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const v = value.trim();
      if (v) params.set("q", v);
      else params.delete("q");
      params.set("page", "1");
      if (!params.has("limit")) params.set("limit", String(limit));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, limit]
  );

  // Debounced search: update URL after 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const current = searchParams.get("q") || "";
      if (searchInput.trim() !== current) {
        applySearch(searchInput);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, applySearch, searchParams]);

  const updateUrl = useCallback(
    (updates: { page?: number; limit?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.page != null) params.set("page", String(updates.page));
      if (updates.limit != null) {
        params.set("limit", String(updates.limit));
        if (updates.page == null) params.set("page", "1");
      }
      if (q) params.set("q", q);
      if (!params.has("limit")) params.set("limit", String(limit));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, q, limit]
  );

  const handleRowsChange = (value: string) => {
    const n = parseInt(value, 10);
    if (ROWS_OPTIONS.includes(n as (typeof ROWS_OPTIONS)[number])) {
      updateUrl({ limit: n, page: 1 });
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (q) params.set("q", q);
        const res = await fetch(
          `/api/platform-admin/institutions/${institutionId}/learners?${params}`
        );
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j.error || "Failed to fetch learners");
        }
        const data = await res.json();
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "An error occurred");
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [institutionId, page, limit, q]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                  debounceRef.current = null;
                }
                applySearch(searchInput);
              }
            }}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {loading ? (
        <LoadingTable />
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No learners found"
          description={
            q
              ? `No learners match "${q}". Try a different search.`
              : "No learners have been registered with this institution yet."
          }
          icon={<GraduationCap className="h-12 w-12 text-gray-400" />}
        />
      ) : (
        <>
          <div className="rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_th]:dark:border-gray-800 [&_td]:border [&_td]:border-gray-200 [&_td]:dark:border-gray-800">
                <TableHeader>
                  <TableRow className="bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-900/80">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 w-12 text-center py-2.5 px-4">
                      #
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 min-w-[160px] py-2.5 px-4">
                      Name
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 min-w-[140px] max-w-[200px] py-2.5 px-4">
                      National ID
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 w-[100px] py-2.5 px-4">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 whitespace-nowrap py-2.5 px-4 w-[110px]">
                      Registered
                    </TableHead>
                    <TableHead className="sticky right-0 z-10 bg-gray-50/80 dark:bg-gray-900/80 border-l border-gray-200 dark:border-gray-800 text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 text-right py-2.5 px-4 w-28 min-w-[7rem]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((l, i) => {
                    const name = [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";
                    const email = l.user?.email || null;
                    const idLine = [l.national_id, l.alternate_id].filter(Boolean).join(" / ") || "—";
                    return (
                      <TableRow
                        key={l.learner_id}
                        className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <TableCell className="text-center tabular-nums font-semibold text-gray-700 dark:text-gray-300 py-2.5 px-4 w-12">
                          {(page - 1) * limit + i + 1}
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {name}
                            </span>
                            {email && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 px-4 font-mono text-sm min-w-0 max-w-[200px]">
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <span className="block truncate text-gray-700 dark:text-gray-300">
                                {idLine}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs font-mono break-all">
                              {idLine}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <Badge
                            variant="default"
                            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                          >
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400 py-2.5 px-4 whitespace-nowrap">
                          {formatDate(l.created_at)}
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-900/50 py-2.5 px-4 text-right">
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/platform-admin/learners/${l.learner_id}`}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Eye className="h-4 w-4" aria-hidden />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top">View learner</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer: Rows per page (left), Showing X–Y of Z, Prev/Next */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page</span>
              <Select
                value={String(limit)}
                onChange={(e) => handleRowsChange(e.target.value)}
                className="w-[70px]"
              >
                {ROWS_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing {from}–{to} of {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUrl({ page: page - 1 })}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateUrl({ page: page + 1 })}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </TooltipProvider>
  );
}
