"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Users, Eye, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_learners";
const PINS_KEY = "yv_table_pins:platform_admin_learners";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const COLUMNS = [
  { id: "row_num", label: "#", minWidth: 48, sortable: false },
  { id: "national_id", label: "National ID", minWidth: 130, sortable: true },
  { id: "first_name", label: "First Name", minWidth: 120, sortable: true },
  { id: "last_name", label: "Last Name", minWidth: 120, sortable: true },
  { id: "institution", label: "Institution", minWidth: 160, sortable: true },
  { id: "created", label: "Created", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 120, sortable: false },
] as const;

function LearnersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [learners, setLearners] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [institutionId, setInstitutionId] = useState(searchParams.get("institution_id") || "");
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (ROWS_PER_PAGE_OPTIONS.includes(n as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
          setPageSizeState(n);
        }
      }
      const storedPins = localStorage.getItem(PINS_KEY);
      if (storedPins) {
        const parsed = JSON.parse(storedPins) as Record<string, "left" | "right">;
        if (parsed && typeof parsed === "object") setPinsState(parsed);
      }
    } catch (_) { /* ignore */ }
  }, []);

  // Fetch institutions for filter dropdown
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoadingInstitutions(true);
        const response = await fetch("/api/platform-admin/institutions?limit=100");
        if (response.ok) {
          const data = await response.json();
          setInstitutions(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch institutions:", err);
      } finally {
        setLoadingInstitutions(false);
      }
    };
    fetchInstitutions();
  }, []);

  useEffect(() => {
    fetchLearners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, institutionId, offset, pageSize]);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (institutionId) params.set("institution_id", institutionId);
      params.set("limit", pageSize.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/platform-admin/learners?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch learners");
      }

      const data = await response.json();
      setLearners(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading learners");
      setLearners([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setOffset(0);
    updateURL({ q: value, institution_id: institutionId });
  };

  const handleInstitutionChange = (value: string) => {
    setInstitutionId(value);
    setOffset(0);
    updateURL({ q: searchQuery, institution_id: value });
  };

  const updateURL = (params: { q?: string; institution_id?: string }) => {
    const urlParams = new URLSearchParams();
    if (params.q) urlParams.set("q", params.q);
    if (params.institution_id) urlParams.set("institution_id", params.institution_id);
    router.push(`?${urlParams.toString()}`, { scroll: false });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSizeState(size);
    setOffset(0);
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch (_) { /* ignore */ }
  };

  const setPin = (colId: string, side: "left" | "right" | null) => {
    setPinsState((prev) => {
      const next = { ...prev };
      if (side) next[colId] = side;
      else delete next[colId];
      try {
        localStorage.setItem(PINS_KEY, JSON.stringify(next));
      } catch (_) { /* ignore */ }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const orderedCols = useMemo(() => {
    const left: (typeof COLUMNS)[number][] = [];
    const mid: (typeof COLUMNS)[number][] = [];
    const right: (typeof COLUMNS)[number][] = [];
    for (const c of COLUMNS) {
      if (pins[c.id] === "left") left.push(c);
      else if (pins[c.id] === "right") right.push(c);
      else mid.push(c);
    }
    return [...left, ...mid, ...right];
  }, [pins]);

  const sortedLearners = useMemo(() => {
    if (!sortKey || !sortDir) return learners;
    return [...learners].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortKey) {
        case "national_id":
          va = a.national_id || "";
          vb = b.national_id || "";
          break;
        case "first_name":
          va = a.first_name || "";
          vb = b.first_name || "";
          break;
        case "last_name":
          va = a.last_name || "";
          vb = b.last_name || "";
          break;
        case "institution":
          va = a.institution?.trading_name || a.institution?.legal_name || "";
          vb = b.institution?.trading_name || b.institution?.legal_name || "";
          break;
        case "created":
          va = a.created_at ? new Date(a.created_at).getTime() : 0;
          vb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return sortDir === "asc" ? va - vb : vb - va;
        default:
          return 0;
      }
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [learners, sortKey, sortDir]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Learners</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Manage all learners across institutions
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search learners"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={institutionId}
            onChange={(e) => handleInstitutionChange(e.target.value)}
            disabled={loadingInstitutions}
            className="w-[200px] sm:w-[240px]"
          >
            <option value="">All Institutions</option>
            {institutions.map((inst) => (
              <option key={inst.institution_id} value={inst.institution_id}>
                {inst.trading_name || inst.legal_name}
              </option>
            ))}
          </Select>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingTable columns={7} rows={5} />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <p className="text-xs text-gray-500">
              Check your connection and try again, or refine your filters.
            </p>
          </div>
        ) : learners.length === 0 ? (
          <EmptyState
            title={searchQuery || institutionId ? "No learners found" : "No learners yet"}
            description={
              searchQuery || institutionId
                ? "No learners match your filters. Try adjusting your search or institution filter."
                : "No learners have been added yet. They will appear here when institutions register them."
            }
            icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
            variant={searchQuery || institutionId ? "no-results" : "default"}
          />
        ) : (
          <>
            <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    {orderedCols.map((col) => {
                      const isLeft = pins[col.id] === "left";
                      const isRight = pins[col.id] === "right";
                      let leftOffset = 0;
                      if (isLeft) {
                        const idx = orderedCols.findIndex((c) => c.id === col.id);
                        for (let i = 0; i < idx; i++) leftOffset += orderedCols[i].minWidth;
                      }
                      let rightOffset = 0;
                      if (isRight) {
                        const idx = orderedCols.findIndex((c) => c.id === col.id);
                        for (let i = idx + 1; i < orderedCols.length; i++)
                          rightOffset += orderedCols[i].minWidth;
                      }
                      const stickyStyle =
                        isLeft || isRight
                          ? {
                              position: "sticky" as const,
                              ...(isLeft ? { left: leftOffset, zIndex: 1 } : {}),
                              ...(isRight ? { right: rightOffset, zIndex: 1 } : {}),
                              minWidth: col.minWidth,
                              backgroundColor: "rgb(249, 250, 251)",
                            }
                          : { minWidth: col.minWidth };
                      return (
                        <TableHead
                          key={col.id}
                          className="whitespace-nowrap truncate"
                          style={stickyStyle}
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate">{col.label}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex size-6 shrink-0 items-center justify-center rounded hover:bg-gray-200/60"
                                  aria-label={`Column menu for ${col.label}`}
                                >
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {col.sortable && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSortKey(col.id);
                                        setSortDir("asc");
                                      }}
                                    >
                                      <ArrowUp className="h-3.5 w-3.5 mr-2" />
                                      Asc
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSortKey(col.id);
                                        setSortDir("desc");
                                      }}
                                    >
                                      <ArrowDown className="h-3.5 w-3.5 mr-2" />
                                      Desc
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => setPin(col.id, "left")}>
                                  Pin to left
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPin(col.id, "right")}>
                                  Pin to right
                                </DropdownMenuItem>
                                {pins[col.id] && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPin(col.id, null)}>
                                      Unpin
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLearners.map((learner, index) => {
                    const instName =
                      learner.institution?.trading_name || learner.institution?.legal_name || "";
                    const createdStr = formatDate(learner.created_at);
                    const rowNum = offset + index + 1;
                    return (
                      <TableRow key={learner.learner_id}>
                        {orderedCols.map((col) => {
                          const isLeft = pins[col.id] === "left";
                          const isRight = pins[col.id] === "right";
                          let leftOffset = 0;
                          if (isLeft) {
                            const idx = orderedCols.findIndex((c) => c.id === col.id);
                            for (let i = 0; i < idx; i++) leftOffset += orderedCols[i].minWidth;
                          }
                          let rightOffset = 0;
                          if (isRight) {
                            const idx = orderedCols.findIndex((c) => c.id === col.id);
                            for (let i = idx + 1; i < orderedCols.length; i++)
                              rightOffset += orderedCols[i].minWidth;
                          }
                          const stickyStyle =
                            isLeft || isRight
                              ? {
                                  position: "sticky" as const,
                                  ...(isLeft ? { left: leftOffset, zIndex: 1 } : {}),
                                  ...(isRight ? { right: rightOffset, zIndex: 1 } : {}),
                                  minWidth: col.minWidth,
                                  backgroundColor: "white",
                                  boxShadow: isLeft
                                    ? "2px 0 4px -2px rgba(0,0,0,0.06)"
                                    : isRight
                                      ? "-2px 0 4px -2px rgba(0,0,0,0.06)"
                                      : undefined,
                                }
                              : { minWidth: col.minWidth };
                          const cellClass =
                            "whitespace-nowrap truncate overflow-hidden text-ellipsis max-w-0 " +
                            (col.id === "actions" ? "whitespace-normal" : "");

                          if (col.id === "row_num") {
                            return (
                              <TableCell
                                key={col.id}
                                className={`text-muted-foreground text-sm font-medium tabular-nums ${cellClass}`}
                                style={stickyStyle}
                              >
                                {rowNum}
                              </TableCell>
                            );
                          }
                          if (col.id === "national_id") {
                            const v = learner.national_id || "—";
                            return (
                              <TableCell
                                key={col.id}
                                className={`font-mono text-sm ${cellClass}`}
                                style={stickyStyle}
                              >
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">{v}</span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-md break-words text-xs z-50"
                                    >
                                      {v}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            );
                          }
                          if (col.id === "first_name") {
                            const v = learner.first_name || "—";
                            return (
                              <TableCell
                                key={col.id}
                                className={`font-medium ${cellClass}`}
                                style={stickyStyle}
                              >
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">{v}</span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-md break-words text-xs z-50"
                                    >
                                      {v}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            );
                          }
                          if (col.id === "last_name") {
                            const v = learner.last_name || "—";
                            return (
                              <TableCell
                                key={col.id}
                                className={`font-medium ${cellClass}`}
                                style={stickyStyle}
                              >
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">{v}</span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-md break-words text-xs z-50"
                                    >
                                      {v}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            );
                          }
                          if (col.id === "institution") {
                            return (
                              <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                                {instName ? (
                                  <TooltipProvider>
                                    <Tooltip delayDuration={200}>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate">{instName}</span>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="max-w-md break-words text-xs z-50"
                                      >
                                        {instName}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            );
                          }
                          if (col.id === "created") {
                            return (
                              <TableCell
                                key={col.id}
                                className={`text-sm text-muted-foreground ${cellClass}`}
                                style={stickyStyle}
                              >
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">{createdStr}</span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-md break-words text-xs z-50"
                                    >
                                      {createdStr}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            );
                          }
                          if (col.id === "actions") {
                            return (
                              <TableCell
                                key={col.id}
                                className="whitespace-nowrap"
                                style={stickyStyle}
                              >
                                <Link href={`/platform-admin/learners/${learner.learner_id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </Link>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={(col as { id: string }).id} className={cellClass} style={stickyStyle} />
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
                    <option key={n} value={n}>
                      {n}
                    </option>
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
  );
}

export default function LearnersPage() {
  return (
    <Suspense fallback={<LoadingTable columns={7} rows={5} />}>
      <LearnersPageContent />
    </Suspense>
  );
}
