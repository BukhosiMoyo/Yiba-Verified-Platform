"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Using native or specialized select? Using imported Select
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { QualificationDetailsSheet } from "@/components/platform-admin/qualifications/QualificationDetailsSheet";
import { Search, GraduationCap, Plus, ChevronDown, ArrowUp, ArrowDown, Eye, Loader2, Edit, Archive } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_qualifications";
const PINS_KEY = "yv_table_pins:platform_admin_qualifications";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const COLUMNS = [
  { id: "name", label: "Name", minWidth: 220, sortable: true },
  { id: "code", label: "Code", minWidth: 100, sortable: true },
  { id: "type", label: "Type", minWidth: 140, sortable: false }, // Sortable? Maybe later
  { id: "nqf", label: "NQF", minWidth: 60, sortable: false },
  { id: "status", label: "Status", minWidth: 100, sortable: false },
  { id: "created", label: "Created", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 100, sortable: false },
] as const;

function QualificationsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  const [total, setTotal] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<any>(null); // Should be typed
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const openDetails = (qualificationId: string) => {
    setDetailsId(qualificationId);
    setDetailsOpen(true);
    setDetailsData(null);
    setDetailsError(null);
    setDetailsLoading(true);
    fetch(`/api/platform-admin/qualifications/${qualificationId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) return { error: "Qualification not found." };
          return res.json().then((d) => ({ error: d.error || "Failed to load" }));
        }
        return res.json();
      })
      .then((data) => {
        if (data?.error) {
          setDetailsError(data.error);
          setDetailsData(null);
        } else {
          setDetailsData(data);
          setDetailsError(null);
        }
      })
      .catch(() => {
        setDetailsError("Failed to load qualification details.");
        setDetailsData(null);
      })
      .finally(() => setDetailsLoading(false));
  };

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

  useEffect(() => {
    fetchQualifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, typeFilter, statusFilter, offset, pageSize]);

  const fetchQualifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("limit", pageSize.toString());
      params.set("offset", offset.toString());

      const response = await fetch(`/api/platform-admin/qualifications?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch qualifications");
      }

      const data = await response.json();
      setQualifications(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading qualifications");
      setQualifications([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (key: string, value: string) => {
    setOffset(0);
    const params = new URLSearchParams(searchParams);

    if (key === "q") {
      setSearchQuery(value);
      if (value) params.set("q", value); else params.delete("q");
    } else if (key === "type") {
      setTypeFilter(value);
      if (value && value !== "ALL") params.set("type", value); else params.delete("type");
    } else if (key === "status") {
      setStatusFilter(value);
      if (value && value !== "ALL") params.set("status", value); else params.delete("status");
    }

    router.push(`?${params.toString()}`, { scroll: false });
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

  const sortedQualifications = useMemo(() => {
    if (!sortKey || !sortDir) return qualifications;
    return [...qualifications].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortKey) {
        case "name":
          va = a.name || "";
          vb = b.name || "";
          break;
        case "code":
          va = a.code || "";
          vb = b.code || "";
          break;
        case "created":
          va = a.created_at ? new Date(a.created_at).getTime() : 0;
          vb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return sortDir === "asc" ? va - vb : vb - va;
        case "updated":
          va = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          vb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return sortDir === "asc" ? va - vb : vb - va;
        default:
          return 0;
      }
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [qualifications, sortKey, sortDir]);

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Qualifications</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage qualifications available across the platform
          </p>
        </div>
        <Link href="/platform-admin/qualifications/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Qualification
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search qualifications"
            value={searchQuery}
            onChange={(e) => updateFilters("q", e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter || "ALL"} onValueChange={(v) => updateFilters("type", v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="OCCUPATIONAL_CERTIFICATE">Occ. Certificate</SelectItem>
            <SelectItem value="SKILL_PROGRAMME">Skills Programme</SelectItem>
            <SelectItem value="LEARNERSHIP">Learnership</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter || "ALL"} onValueChange={(v) => updateFilters("status", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingTable columns={7} rows={5} />
      ) : qualifications.length === 0 ? (
        <EmptyState
          title="No qualifications found"
          description={
            searchQuery || typeFilter || statusFilter
              ? `No qualifications match your filters.`
              : "No qualifications have been created yet."
          }
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
          variant={searchQuery ? "no-results" : "default"}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="#" className="whitespace-nowrap w-12 text-center" style={{ minWidth: 48 }}>
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
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {col.sortable && (
                                <>
                                  <DropdownMenuItem onClick={() => { setSortKey(col.id); setSortDir("asc"); }}>
                                    <ArrowUp className="h-3.5 w-3.5 mr-2" /> Asc
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSortKey(col.id); setSortDir("desc"); }}>
                                    <ArrowDown className="h-3.5 w-3.5 mr-2" /> Desc
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => setPin(col.id, "left")}>Pin to left</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPin(col.id, "right")}>Pin to right</DropdownMenuItem>
                              {pins[col.id] && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setPin(col.id, null)}>Unpin</DropdownMenuItem>
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
                {sortedQualifications.map((qualification, index) => {
                  const createdStr = formatDate(qualification.created_at);
                  const updatedStr = formatDate(qualification.updated_at);
                  return (
                    <TableRow key={qualification.qualification_id} className="group">
                      <TableCell key="#" className="whitespace-nowrap text-center text-muted-foreground text-sm" style={{ minWidth: 48 }}>
                        {offset + index + 1}
                      </TableCell>
                      {orderedCols.map((col) => {
                        // ... Sticky logic omitted for brevity (same as before) ...
                        const isLeft = pins[col.id] === "left";
                        const isRight = pins[col.id] === "right";
                        let leftOffset = 0; if (isLeft) { const idx = orderedCols.findIndex((c) => c.id === col.id); for (let i = 0; i < idx; i++) leftOffset += orderedCols[i].minWidth; }
                        let rightOffset = 0; if (isRight) { const idx = orderedCols.findIndex((c) => c.id === col.id); for (let i = idx + 1; i < orderedCols.length; i++) rightOffset += orderedCols[i].minWidth; }
                        const stickyStyle = isLeft || isRight ? { position: "sticky" as const, ...(isLeft ? { left: leftOffset, zIndex: 1 } : {}), ...(isRight ? { right: rightOffset, zIndex: 1 } : {}), minWidth: col.minWidth, backgroundColor: "hsl(var(--card))", boxShadow: isLeft ? "2px 0 4px -2px rgba(0,0,0,0.06)" : isRight ? "-2px 0 4px -2px rgba(0,0,0,0.06)" : undefined } : { minWidth: col.minWidth };

                        const cellClass = "whitespace-nowrap truncate overflow-hidden text-ellipsis max-w-0";

                        if (col.id === "name") {
                          return (
                            <TableCell key={col.id} className={`font-medium ${cellClass}`} style={stickyStyle}>
                              <Link href={`/platform-admin/qualifications/${qualification.qualification_id}/edit`} className="hover:underline">
                                {qualification.name || "—"}
                              </Link>
                            </TableCell>
                          );
                        }
                        if (col.id === "code") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              {qualification.code ? <Badge variant="outline" className="font-mono text-xs">{qualification.code}</Badge> : "—"}
                            </TableCell>
                          );
                        }
                        if (col.id === "type") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              <span className="text-xs text-muted-foreground">{qualification.type?.replace(/_/g, " ") || "—"}</span>
                            </TableCell>
                          );
                        }
                        if (col.id === "nqf") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              {qualification.nqf_level ? <Badge variant="secondary" className="text-[10px]">NQF {qualification.nqf_level}</Badge> : "—"}
                            </TableCell>
                          );
                        }
                        if (col.id === "status") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              <Badge variant={qualification.status === "ACTIVE" ? "default" : "secondary"}>{qualification.status}</Badge>
                            </TableCell>
                          );
                        }
                        if (col.id === "created") {
                          return (
                            <TableCell key={col.id} className={`text-sm text-muted-foreground ${cellClass}`} style={stickyStyle}>
                              {createdStr}
                            </TableCell>
                          );
                        }
                        if (col.id === "actions") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/platform-admin/qualifications/${qualification.qualification_id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/platform-admin/qualifications/${qualification.qualification_id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </TableCell>
                          );
                        }
                        return <TableCell key={(col as any).id} className={cellClass} style={stickyStyle} />;
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls ... (omitted for brevity, assume updated) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => handlePageSizeChange(parseInt(v, 10))}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROWS_PER_PAGE_OPTIONS.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - pageSize))} disabled={offset === 0}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setOffset(offset + pageSize)} disabled={offset + pageSize >= total}>Next</Button>
              </div>
            </div>
          </div>


          <QualificationDetailsSheet
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            qualification={detailsData}
            loading={detailsLoading}
          />
        </>
      )}
    </div>
  );
}


export default function QualificationsPage() {
  return (
    <Suspense fallback={<LoadingTable columns={5} rows={5} />}>
      <QualificationsPageContent />
    </Suspense>
  );
}
