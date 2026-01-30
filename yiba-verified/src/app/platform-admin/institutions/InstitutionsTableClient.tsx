"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { Search, Building2, Eye, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_institutions";
const PINS_KEY = "yv_table_pins:platform_admin_institutions";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const PREFETCH_VIEW_ROWS = 20;

const COLUMNS = [
  { id: "row_number", label: "#", minWidth: 50, sortable: false },
  { id: "legal_name", label: "Legal Name", minWidth: 160, sortable: true },
  { id: "trading_name", label: "Trading Name", minWidth: 140, sortable: true },
  { id: "province", label: "Province", minWidth: 100, sortable: true },
  { id: "registration_number", label: "Registration Number", minWidth: 140, sortable: true },
  { id: "status", label: "Status", minWidth: 100, sortable: true },
  { id: "created", label: "Created", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 120, sortable: false },
] as const;

type InstitutionRow = {
  institution_id: string;
  legal_name: string;
  trading_name: string | null;
  province: string;
  registration_number: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export interface InstitutionsTableClientProps {
  institutions: InstitutionRow[];
  total: number;
  initialQ: string;
  limit: number;
  offset: number;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatStatus(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300" },
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" },
    SUSPENDED: { label: "Suspended", className: "bg-muted text-muted-foreground" },
  };
  return map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
}

export function InstitutionsTableClient({
  institutions,
  total,
  initialQ,
  limit,
  offset,
}: InstitutionsTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setSearchQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PINS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, "left" | "right">;
        if (parsed && typeof parsed === "object") setPinsState(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const prefetchView = (path: string) => () => {
    if (path?.startsWith("/")) router.prefetch(path);
  };

  useEffect(() => {
    const toPrefetch = institutions
      .slice(0, PREFETCH_VIEW_ROWS)
      .map((i) => `/platform-admin/institutions/${i.institution_id}`);
    toPrefetch.forEach((path) => router.prefetch(path));
  }, [router, institutions]);

  const buildParams = (updates: { q?: string; limit?: number; offset?: number }) => {
    const p = new URLSearchParams(searchParams.toString());
    const qq = updates.q !== undefined ? updates.q : initialQ;
    const lim = updates.limit ?? limit;
    const off = updates.offset ?? offset;
    if (qq) p.set("q", qq);
    else p.delete("q");
    p.set("limit", String(lim));
    p.set("offset", String(off));
    return p.toString();
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    router.push(`?${buildParams({ q: value, offset: 0 })}`, { scroll: false });
  };

  const handlePageSizeChange = (size: number) => {
    try {
      localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch {
      /* ignore */
    }
    router.push(`?${buildParams({ limit: size, offset: 0 })}`, { scroll: false });
  };

  const setPin = (colId: string, side: "left" | "right" | null) => {
    setPinsState((prev) => {
      const next = { ...prev };
      if (side) next[colId] = side;
      else delete next[colId];
      try {
        localStorage.setItem(PINS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const goPrev = () => {
    const nextOffset = Math.max(0, offset - limit);
    router.push(`?${buildParams({ offset: nextOffset })}`, { scroll: false });
  };

  const goNext = () => {
    if (offset + limit >= total) return;
    router.push(`?${buildParams({ offset: offset + limit })}`, { scroll: false });
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
          va = a.legal_name ?? "";
          vb = b.legal_name ?? "";
          break;
        case "trading_name":
          va = a.trading_name ?? "";
          vb = b.trading_name ?? "";
          break;
        case "province":
          va = a.province ?? "";
          vb = b.province ?? "";
          break;
        case "registration_number":
          va = a.registration_number ?? "";
          vb = b.registration_number ?? "";
          break;
        case "status":
          va = a.status ?? "";
          vb = b.status ?? "";
          break;
        case "created":
          va = new Date(a.created_at).getTime();
          vb = new Date(b.created_at).getTime();
          return sortDir === "asc" ? va - vb : vb - va;
        default:
          return 0;
      }
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [institutions, sortKey, sortDir]);

  return (
    <>
      <div className="relative w-48 sm:w-64 mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search institutions"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {institutions.length === 0 ? (
        <EmptyState
          title={initialQ ? "No institutions found" : "No institutions yet"}
          description={
            initialQ
              ? `No institutions match "${initialQ}". Try a different search term.`
              : "No institutions have been created yet."
          }
          icon={<Building2 className="h-6 w-6" strokeWidth={1.5} />}
          variant={initialQ ? "no-results" : "default"}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
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
                                className="inline-flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted"
                                aria-label={`Column menu for ${col.label}`}
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                {sortedInstitutions.map((institution, rowIndex) => {
                  const statusInfo = formatStatus(institution.status);
                  const createdStr = formatDate(institution.created_at);
                  const rowNumber = offset + rowIndex + 1;
                  return (
                    <TableRow key={institution.institution_id}>
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

                        if (col.id === "row_number") {
                          return (
                            <TableCell
                              key={col.id}
                              className="text-center text-muted-foreground font-medium"
                              style={stickyStyle}
                            >
                              {rowNumber}
                            </TableCell>
                          );
                        }
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
                          const v = institution.province ?? "—";
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
                          const v = institution.registration_number ?? "—";
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
                          const detailHref = `/platform-admin/institutions/${institution.institution_id}`;
                          return (
                            <TableCell
                              key={col.id}
                              className="whitespace-nowrap"
                              style={stickyStyle}
                            >
                              <Link
                                href={detailHref}
                                onMouseEnter={prefetchView(detailHref)}
                              >
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell
                            key={(col as { id: string }).id}
                            className={cellClass}
                            style={stickyStyle}
                          />
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
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(limit)}
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
              <span className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
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
    </>
  );
}
