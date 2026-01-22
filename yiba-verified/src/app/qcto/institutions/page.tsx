"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, Building2, Eye, ChevronDown, ArrowUp, ArrowDown, X } from "lucide-react";
import Link from "next/link";
import { PROVINCES } from "@/lib/provinces";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_institutions";
const PINS_KEY = "yv_table_pins:qcto_institutions";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const PROVINCE_OPTIONS = [
  { value: "", label: "All provinces" },
  ...PROVINCES.map((p) => ({ value: p, label: p })),
];

const NUM_COL_MIN = 48;

const COLUMNS = [
  { id: "legal_name", label: "Legal Name", minWidth: 160, sortable: true },
  { id: "trading_name", label: "Trading Name", minWidth: 140, sortable: true },
  { id: "province", label: "Province", minWidth: 100, sortable: true },
  { id: "registration_number", label: "Registration Number", minWidth: 140, sortable: true },
  { id: "status", label: "Status", minWidth: 100, sortable: true },
  { id: "created", label: "Created", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 120, sortable: false },
] as const;

function InstitutionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [provinceFilter, setProvinceFilter] = useState(searchParams.get("province") || "");
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({ actions: "right" });
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
        if (parsed && typeof parsed === "object") setPinsState({ ...parsed, actions: "right" });
      }
    } catch (_) { /* ignore */ }
  }, []);

  // Sync URL (q, province) into state when navigating via sidebar or shared link
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setProvinceFilter(searchParams.get("province") || "");
    setOffset(0);
  }, [searchParams]);

  useEffect(() => {
    fetchInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, provinceFilter, offset, pageSize]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (provinceFilter) params.set("province", provinceFilter);
      params.set("limit", pageSize.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/qcto/institutions?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch institutions");
      }

      const data = await response.json();
      setInstitutions(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading institutions");
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const pushURL = (q: string, province: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (province) p.set("province", province);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setOffset(0);
    pushURL(value, provinceFilter);
  };

  const handleProvinceFilter = (value: string) => {
    setProvinceFilter(value);
    setOffset(0);
    pushURL(searchQuery, value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setProvinceFilter("");
    setOffset(0);
    router.push("?", { scroll: false });
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

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
      SUSPENDED: { label: "Suspended", className: "bg-gray-100 text-gray-800" },
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
    };
    return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
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

  const sortedInstitutions = useMemo(() => {
    if (!sortKey || !sortDir) return institutions;
    return [...institutions].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortKey) {
        case "legal_name":
          va = a.legal_name || "";
          vb = b.legal_name || "";
          break;
        case "trading_name":
          va = a.trading_name || "";
          vb = b.trading_name || "";
          break;
        case "province":
          va = a.province || "";
          vb = b.province || "";
          break;
        case "registration_number":
          va = a.registration_number || "";
          vb = b.registration_number || "";
          break;
        case "status":
          va = a.status || "";
          vb = b.status || "";
          break;
        case "created":
          va = a.created_at ? new Date(a.created_at).getTime() : 0;
          vb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
        default:
          return 0;
      }
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [institutions, sortKey, sortDir]);

  const hasActiveFilters = !!searchQuery || !!provinceFilter;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            Institutions
            {provinceFilter && (
              <span className="inline-flex items-center rounded-full border border-gray-200/80 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800 shadow-sm">
                {provinceFilter}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            View institutions on the platform
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search institutions"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingTable columns={8} rows={5} />
      ) : institutions.length === 0 ? (
        <EmptyState
          title="No institutions found"
          description={
            hasActiveFilters
              ? "Try adjusting your filters or search."
              : "No institutions have been created yet."
          }
          icon={<Building2 className="h-6 w-6" strokeWidth={1.5} />}
          variant={hasActiveFilters ? "no-results" : "default"}
        />
      ) : (
        <>
          <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wide text-gray-500 w-12 bg-gray-50 border-r border-gray-200"
                    style={{ position: "sticky", left: 0, zIndex: 2, minWidth: NUM_COL_MIN, backgroundColor: "rgb(249, 250, 251)" }}
                  >
                    #
                  </TableHead>
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
                {sortedInstitutions.map((institution, index) => {
                  const statusInfo = formatStatus(institution.status);
                  const createdStr = formatDate(institution.created_at);
                  return (
                    <TableRow key={institution.institution_id}>
                      <TableCell
                        className="whitespace-nowrap text-gray-800 font-bold w-12 bg-white border-r border-gray-200"
                        style={{ position: "sticky", left: 0, zIndex: 1, minWidth: NUM_COL_MIN, backgroundColor: "white", boxShadow: "2px 0 4px -2px rgba(0,0,0,0.06)" }}
                      >
                        {offset + index + 1}
                      </TableCell>
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

                        if (col.id === "legal_name") {
                          return (
                            <TableCell
                              key={col.id}
                              className={`font-medium ${cellClass}`}
                              style={stickyStyle}
                            >
                              <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate">
                                      {institution.legal_name}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-md break-words text-xs z-50"
                                  >
                                    {institution.legal_name}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        }
                        if (col.id === "trading_name") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              {institution.trading_name ? (
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <span className="block truncate">
                                        {institution.trading_name}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-md break-words text-xs z-50"
                                    >
                                      {institution.trading_name}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          );
                        }
                        if (col.id === "province") {
                          const v = institution.province || "—";
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
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
                        if (col.id === "registration_number") {
                          const v = institution.registration_number || "—";
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
                        if (col.id === "status") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              <Badge className={statusInfo.className}>
                                {statusInfo.label}
                              </Badge>
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
                              className="whitespace-nowrap border-l border-gray-200"
                              style={stickyStyle}
                            >
                              <Button variant="outline" size="sm" asChild className="h-6 min-w-0 px-1.5 text-[11px] gap-1 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-400">
                                <Link href={`/qcto/institutions/${institution.institution_id}`}>
                                  <Eye className="h-3 w-3" aria-hidden />
                                  View
                                </Link>
                              </Button>
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

export default function QCTOInstitutionsPage() {
  return (
    <Suspense fallback={<LoadingTable columns={8} rows={5} />}>
      <InstitutionsPageContent />
    </Suspense>
  );
}
