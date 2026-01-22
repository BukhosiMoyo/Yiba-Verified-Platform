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
import { Search, GraduationCap, Plus, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
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
          <DialogContent className="bg-white">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search qualifications"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
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
          <div className="rounded-xl border border-gray-200/60 overflow-x-auto bg-white">
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
                                backgroundColor: "white",
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

export default function QualificationsPage() {
  return (
    <Suspense fallback={<LoadingTable columns={5} rows={5} />}>
      <QualificationsPageContent />
    </Suspense>
  );
}
