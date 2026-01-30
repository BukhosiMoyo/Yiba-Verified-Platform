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
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { Search, Users, Eye, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_learners";
const PINS_KEY = "yv_table_pins:platform_admin_learners";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const PREFETCH_VIEW_ROWS = 20;

const COLUMNS = [
  { id: "row_num", label: "#", minWidth: 48, sortable: false },
  { id: "national_id", label: "National ID", minWidth: 130, sortable: true },
  { id: "first_name", label: "First Name", minWidth: 120, sortable: true },
  { id: "last_name", label: "Last Name", minWidth: 120, sortable: true },
  { id: "institution", label: "Institution", minWidth: 160, sortable: true },
  { id: "created", label: "Created", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 120, sortable: false },
] as const;

type LearnerRow = {
  learner_id: string;
  national_id: string;
  first_name: string;
  last_name: string;
  institution_id: string;
  created_at: Date | string;
  institution: {
    institution_id: string;
    legal_name: string;
    trading_name: string | null;
  } | null;
};

type InstitutionOption = {
  institution_id: string;
  legal_name: string;
  trading_name: string | null;
};

export interface LearnersTableClientProps {
  learners: LearnerRow[];
  total: number;
  institutions: InstitutionOption[];
  initialQ: string;
  initialInstitutionId: string;
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

export function LearnersTableClient({
  learners,
  total,
  institutions,
  initialQ,
  initialInstitutionId,
  limit,
  offset,
}: LearnersTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [institutionId, setInstitutionId] = useState(initialInstitutionId);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setSearchQuery(initialQ);
    setInstitutionId(initialInstitutionId);
  }, [initialQ, initialInstitutionId]);

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

  const buildParams = (updates: {
    q?: string;
    institution_id?: string;
    limit?: number;
    offset?: number;
  }) => {
    const p = new URLSearchParams(searchParams.toString());
    const qq = updates.q !== undefined ? updates.q : initialQ;
    const iid = updates.institution_id !== undefined ? updates.institution_id : initialInstitutionId;
    const lim = updates.limit ?? limit;
    const off = updates.offset ?? offset;
    if (qq) p.set("q", qq);
    else p.delete("q");
    if (iid) p.set("institution_id", iid);
    else p.delete("institution_id");
    p.set("limit", String(lim));
    p.set("offset", String(off));
    return p.toString();
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    router.push(`?${buildParams({ q: value, offset: 0 })}`, { scroll: false });
  };

  const handleInstitutionChange = (value: string) => {
    setInstitutionId(value);
    router.push(`?${buildParams({ institution_id: value, offset: 0 })}`, { scroll: false });
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

  const institutionOptions = useMemo(
    () =>
      institutions.map((inst) => ({
        value: inst.institution_id,
        label: inst.trading_name || inst.legal_name,
      })),
    [institutions]
  );

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
          va = a.national_id ?? "";
          vb = b.national_id ?? "";
          break;
        case "first_name":
          va = a.first_name ?? "";
          vb = b.first_name ?? "";
          break;
        case "last_name":
          va = a.last_name ?? "";
          vb = b.last_name ?? "";
          break;
        case "institution":
          va = a.institution?.trading_name || a.institution?.legal_name || "";
          vb = b.institution?.trading_name || b.institution?.legal_name || "";
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
  }, [learners, sortKey, sortDir]);

  useEffect(() => {
    const toPrefetch = sortedLearners
      .slice(0, PREFETCH_VIEW_ROWS)
      .map((l) => `/platform-admin/learners/${l.learner_id}`);
    toPrefetch.forEach((path) => router.prefetch(path));
  }, [router, sortedLearners]);

  const hasFilters = !!initialQ || !!initialInstitutionId;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search learners"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <SearchableSelect
          value={institutionId}
          onChange={handleInstitutionChange}
          options={institutionOptions}
          placeholder="Select institution"
          searchPlaceholder="Search institutions..."
          allOptionLabel="All Institutions"
          emptyText="No institutions found"
          className="w-[200px] sm:w-[240px]"
        />
      </div>

      {learners.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No learners found" : "No learners yet"}
          description={
            hasFilters
              ? "No learners match your filters. Try adjusting your search or institution filter."
              : "No learners have been added yet. They will appear here when institutions register them."
          }
          icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          variant={hasFilters ? "no-results" : "default"}
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
                            backgroundColor: "hsl(var(--muted))",
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
                                backgroundColor: "hsl(var(--card))",
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
                              <Link
                                href={`/platform-admin/learners/${learner.learner_id}`}
                                onMouseEnter={prefetchView(`/platform-admin/learners/${learner.learner_id}`)}
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
