"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingTable } from "@/components/shared/LoadingTable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, GraduationCap, Plus, ChevronDown, ArrowUp, ArrowDown, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE_KEY = "yv_table_page_size:platform_admin_qualifications";
const PINS_KEY = "yv_table_pins:platform_admin_qualifications";
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const COLUMNS = [
  { id: "name", label: "Name", minWidth: 220, sortable: true },
  { id: "code", label: "Code", minWidth: 120, sortable: true },
  { id: "created", label: "Created", minWidth: 110, sortable: true },
  { id: "updated", label: "Updated", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 100, sortable: false },
] as const;

function QualificationsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<{
    qualification_id: string;
    name: string;
    code: string | null;
    created_at: string;
    updated_at: string;
    _count: { enrolments: number };
    enrolments: Array<{
      enrolment_id: string;
      qualification_title: string;
      enrolment_status: string;
      start_date: string;
      created_at: string;
      institution?: { legal_name: string | null; trading_name: string | null };
      learner?: { first_name: string; last_name: string };
    }>;
  } | null>(null);
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
  }, [searchQuery, offset, pageSize]);

  const fetchQualifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setOffset(0);
    const params = new URLSearchParams(searchParams);
    if (value) params.set("q", value);
    else params.delete("q");
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

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Qualification name is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/platform-admin/qualifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          code: newCode.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create qualification");
      }

      toast.success("Qualification created successfully");
      setDialogOpen(false);
      setNewName("");
      setNewCode("");
      fetchQualifications(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Failed to create qualification");
    } finally {
      setSubmitting(false);
    }
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Qualification
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Create New Qualification</DialogTitle>
              <DialogDescription>
                Add a new qualification to the platform. The name must be unique.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Diploma in Information Technology"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code (Optional)</Label>
                <Input
                  id="code"
                  placeholder="e.g., DIT001"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting || !newName.trim()}>
                {submitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search qualifications"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingTable columns={5} rows={5} />
      ) : qualifications.length === 0 ? (
        <EmptyState
          title="No qualifications found"
          description={
            searchQuery
              ? `No qualifications match "${searchQuery}". Try a different search term.`
              : "No qualifications have been created yet. Click 'Add Qualification' to create your first one."
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
                {sortedQualifications.map((qualification, index) => {
                  const createdStr = formatDate(qualification.created_at);
                  const updatedStr = formatDate(qualification.updated_at);
                  return (
                    <TableRow key={qualification.qualification_id}>
                      <TableCell key="#" className="whitespace-nowrap text-center text-muted-foreground text-sm" style={{ minWidth: 48 }}>
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
                                backgroundColor: "hsl(var(--card))",
                                boxShadow: isLeft
                                  ? "2px 0 4px -2px rgba(0,0,0,0.06)"
                                  : isRight
                                    ? "-2px 0 4px -2px rgba(0,0,0,0.06)"
                                    : undefined,
                              }
                            : { minWidth: col.minWidth };
                        const cellClass =
                          "whitespace-nowrap truncate overflow-hidden text-ellipsis max-w-0";

                        if (col.id === "name") {
                          const v = qualification.name || "—";
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
                        if (col.id === "code") {
                          return (
                            <TableCell
                              key={col.id}
                              className={cellClass}
                              style={stickyStyle}
                            >
                              {qualification.code ? (
                                <TooltipProvider>
                                  <Tooltip delayDuration={200}>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="default"
                                        className="font-mono text-xs shrink-0"
                                      >
                                        {qualification.code}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-md break-words text-xs z-50"
                                    >
                                      {qualification.code}
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
                        if (col.id === "updated") {
                          return (
                            <TableCell
                              key={col.id}
                              className={`text-sm text-muted-foreground ${cellClass}`}
                              style={stickyStyle}
                            >
                              <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate">{updatedStr}</span>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-md break-words text-xs z-50"
                                  >
                                    {updatedStr}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        }
                        if (col.id === "actions") {
                          return (
                            <TableCell key={col.id} className={cellClass} style={stickyStyle}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetails(qualification.qualification_id);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View details
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
              <span className="text-sm text-muted-foreground">Rows per page</span>
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
              <span className="text-sm text-muted-foreground">
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

          <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
            <SheetContent
              side="right"
              className="inset-y-0 right-0 h-full w-full max-w-xl rounded-none border-l border-border bg-background shadow-xl overflow-y-auto"
            >
              <SheetHeader className="text-left space-y-2 pb-6 border-b border-border">
                <SheetTitle className="text-foreground text-xl">Qualification details</SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Extra details for this qualification, including linked enrolments.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                {detailsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
                {detailsError && !detailsLoading && (
                  <p className="text-destructive text-sm py-4 px-1">{detailsError}</p>
                )}
                {detailsData && !detailsLoading && (
                  <div className="space-y-6">
                    <section className="space-y-1">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</h3>
                      <p className="text-foreground font-medium">{detailsData.name}</p>
                    </section>
                    {detailsData.code && (
                      <section className="space-y-1">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</h3>
                        <p className="text-foreground font-mono text-sm">{detailsData.code}</p>
                      </section>
                    )}
                    <section className="space-y-1">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</h3>
                      <p className="text-foreground text-sm">{formatDate(detailsData.created_at)}</p>
                    </section>
                    <section className="space-y-1">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated</h3>
                      <p className="text-foreground text-sm">{formatDate(detailsData.updated_at)}</p>
                    </section>
                    <section className="space-y-3">
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enrolments</h3>
                      <p className="text-foreground text-sm">{detailsData._count.enrolments} linked enrolment(s)</p>
                      {detailsData.enrolments.length > 0 && (
                        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 border-b border-border bg-background/80">
                            Recent enrolments (up to 20)
                          </h4>
                          <ul className="divide-y divide-border">
                            {detailsData.enrolments.map((e) => (
                              <li key={e.enrolment_id} className="px-4 py-3 text-sm hover:bg-muted/40 transition-colors duration-150">
                                <span className="font-medium text-foreground">
                                  {e.learner ? `${e.learner.first_name} ${e.learner.last_name}` : "—"}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {e.institution ? (e.institution.trading_name || e.institution.legal_name || "—") : "—"}
                                </span>
                                <span className="block text-xs text-muted-foreground mt-1">
                                  {e.qualification_title} · {e.enrolment_status} · from {formatDate(e.start_date)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
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
