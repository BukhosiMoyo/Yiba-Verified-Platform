"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
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
import { Search, GraduationCap, Plus, ChevronDown, ArrowUp, ArrowDown, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE_KEY = "yv_table_page_size:qcto_qualifications";
const PINS_KEY = "yv_table_pins:qcto_qualifications";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "RETIRED", label: "Retired" },
  { value: "DRAFT", label: "Draft" },
];

const COLUMNS = [
  { id: "qualification", label: "Qualification", minWidth: 260, sortable: true },
  { id: "saqa_id", label: "SAQA ID", minWidth: 100, sortable: true },
  { id: "curriculum_code", label: "Curriculum code", minWidth: 120, sortable: true },
  { id: "nqf", label: "NQF", minWidth: 70, sortable: true },
  { id: "credits", label: "Credits", minWidth: 80, sortable: true },
  { id: "status", label: "Status", minWidth: 100, sortable: true },
  { id: "updated", label: "Updated", minWidth: 110, sortable: true },
  { id: "actions", label: "Actions", minWidth: 100, sortable: false },
] as const;

function formatStatus(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    RETIRED: { label: "Retired", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
    DRAFT: { label: "Draft", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  };
  return map[status] || { label: status, className: "bg-muted text-muted-foreground" };
}

function QctoQualificationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [nqfFilter, setNqfFilter] = useState(searchParams.get("nqf_level") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("occupational_category") || "");
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);
  const [pins, setPinsState] = useState<Record<string, "left" | "right">>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    saqa_id: "",
    curriculum_code: "",
    nqf_level: "",
    credits: "",
    occupational_category: "",
    description: "",
    status: "ACTIVE",
  });
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
    fetchItems();
  }, [searchQuery, statusFilter, nqfFilter, categoryFilter, offset, pageSize]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (nqfFilter) params.set("nqf_level", nqfFilter);
      if (categoryFilter) params.set("occupational_category", categoryFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String(offset));

      const res = await fetch(`/api/qcto/qualifications?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to fetch qualifications");
      }
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const pushUrl = () => {
    const p = new URLSearchParams();
    if (searchQuery) p.set("q", searchQuery);
    if (statusFilter) p.set("status", statusFilter);
    if (nqfFilter) p.set("nqf_level", nqfFilter);
    if (categoryFilter) p.set("occupational_category", categoryFilter);
    router.push(`?${p.toString()}`, { scroll: false });
  };

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    setOffset(0);
    pushUrl();
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
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/qcto/qualifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
          saqa_id: formData.saqa_id.trim() || undefined,
          curriculum_code: formData.curriculum_code.trim() || undefined,
          nqf_level: formData.nqf_level ? parseInt(formData.nqf_level, 10) : undefined,
          credits: formData.credits ? parseInt(formData.credits, 10) : undefined,
          occupational_category: formData.occupational_category.trim() || undefined,
          description: formData.description.trim() || undefined,
          status: formData.status,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create");
      }
      toast.success("Qualification created");
      setDialogOpen(false);
      setFormData({
        name: "",
        code: "",
        saqa_id: "",
        curriculum_code: "",
        nqf_level: "",
        credits: "",
        occupational_category: "",
        description: "",
        status: "ACTIVE",
      });
      fetchItems();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

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

  const sortedItems = useMemo(() => {
    if (!sortKey || !sortDir) return items;
    return [...items].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortKey) {
        case "qualification":
          va = a.name || "";
          vb = b.name || "";
          return sortDir === "asc" ? String(va).localeCompare(String(vb), undefined, { sensitivity: "base" }) : -String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
        case "saqa_id":
          va = a.saqa_id || "";
          vb = b.saqa_id || "";
          return sortDir === "asc" ? String(va).localeCompare(String(vb)) : -String(va).localeCompare(String(vb));
        case "curriculum_code":
          va = a.curriculum_code || "";
          vb = b.curriculum_code || "";
          return sortDir === "asc" ? String(va).localeCompare(String(vb)) : -String(va).localeCompare(String(vb));
        case "nqf":
          va = a.nqf_level ?? 0;
          vb = b.nqf_level ?? 0;
          return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
        case "credits":
          va = a.credits ?? 0;
          vb = b.credits ?? 0;
          return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
        case "status":
          va = a.status || "";
          vb = b.status || "";
          return sortDir === "asc" ? String(va).localeCompare(String(vb)) : -String(va).localeCompare(String(vb));
        case "updated":
          va = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          vb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
        default:
          return 0;
      }
    });
  }, [items, sortKey, sortDir]);

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Qualifications</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage the qualification registry (SAQA / curriculum / NQF)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Qualification
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card max-w-lg">
            <DialogHeader>
              <DialogTitle>Create qualification</DialogTitle>
              <DialogDescription>Add a new entry to the qualification registry.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Diploma in Information Technology" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. DIT001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saqa_id">SAQA ID</Label>
                  <Input id="saqa_id" value={formData.saqa_id} onChange={(e) => setFormData((p) => ({ ...p, saqa_id: e.target.value }))} placeholder="e.g. 12345" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="curriculum_code">Curriculum code</Label>
                <Input id="curriculum_code" value={formData.curriculum_code} onChange={(e) => setFormData((p) => ({ ...p, curriculum_code: e.target.value }))} placeholder="e.g. 123456" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nqf_level">NQF level</Label>
                  <Input id="nqf_level" type="number" min={1} max={10} value={formData.nqf_level} onChange={(e) => setFormData((p) => ({ ...p, nqf_level: e.target.value }))} placeholder="e.g. 6" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input id="credits" type="number" min={0} value={formData.credits} onChange={(e) => setFormData((p) => ({ ...p, credits: e.target.value }))} placeholder="e.g. 360" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupational_category">Occupational category</Label>
                <Input id="occupational_category" value={formData.occupational_category} onChange={(e) => setFormData((p) => ({ ...p, occupational_category: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))} className="w-full">
                  {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting || !formData.name.trim()}>
                {submitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, SAQA, curriculum, alias" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }} className="w-[140px]">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || "_"} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Input placeholder="NQF level" className="w-24" value={nqfFilter} onChange={(e) => { setNqfFilter(e.target.value); setOffset(0); }} />
        <Input placeholder="Occupational category" className="w-40" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setOffset(0); }} />
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <LoadingTable columns={8} rows={8} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No qualifications found"
          description={searchQuery || statusFilter || nqfFilter || categoryFilter ? "Try adjusting filters." : "Add a qualification to get started."}
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
          variant={searchQuery || statusFilter ? "no-results" : "default"}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  {orderedCols.map((col) => {
                    const isLeft = pins[col.id] === "left";
                    const isRight = pins[col.id] === "right";
                    const stickyStyle = isLeft || isRight ? { position: "sticky" as const, zIndex: 1, minWidth: col.minWidth, backgroundColor: "hsl(var(--muted))" } : { minWidth: col.minWidth };
                    return (
                      <TableHead key={col.id} className="whitespace-nowrap" style={stickyStyle}>
                        <div className="flex items-center gap-1">
                          <span>{col.label}</span>
                          {col.sortable && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="inline-flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted" aria-label={`Sort ${col.label}`}>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => { setSortKey(col.id); setSortDir("asc"); }}>
                                  <ArrowUp className="h-3.5 w-3.5 mr-2" /> Asc
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSortKey(col.id); setSortDir("desc"); }}>
                                  <ArrowDown className="h-3.5 w-3.5 mr-2" /> Desc
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    <TableCell className="text-center text-muted-foreground text-sm">{offset + index + 1}</TableCell>
                    {orderedCols.map((col) => {
                      if (col.id === "qualification") {
                        return (
                          <TableCell key={col.id} className="font-medium">
                            <div>
                              <span className="block truncate max-w-[240px]">{row.name || "—"}</span>
                              {(row.code || row.occupational_category) && (
                                <span className="text-xs text-muted-foreground truncate block max-w-[240px]">
                                  {[row.code, row.occupational_category].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        );
                      }
                      if (col.id === "saqa_id") return <TableCell key={col.id} className="font-mono text-sm">{row.saqa_id || "—"}</TableCell>;
                      if (col.id === "curriculum_code") return <TableCell key={col.id} className="font-mono text-sm">{row.curriculum_code || "—"}</TableCell>;
                      if (col.id === "nqf") return <TableCell key={col.id}>{row.nqf_level != null ? `NQF ${row.nqf_level}` : "—"}</TableCell>;
                      if (col.id === "credits") return <TableCell key={col.id}>{row.credits ?? "—"}</TableCell>;
                      if (col.id === "status") {
                        const s = formatStatus(row.status);
                        return <TableCell key={col.id}><Badge className={s.className}>{s.label}</Badge></TableCell>;
                      }
                      if (col.id === "updated") return <TableCell key={col.id} className="text-muted-foreground text-sm">{formatDate(row.updated_at)}</TableCell>;
                      if (col.id === "actions") {
                        return (
                          <TableCell key={col.id}>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/qcto/qualifications/${row.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/qcto/qualifications/${row.id}`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        );
                      }
                      return <TableCell key={(col as { id: string }).id} />;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select value={String(pageSize)} onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))} className="w-[70px]">
                {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - pageSize))} disabled={offset === 0}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setOffset(offset + pageSize)} disabled={offset + pageSize >= total}>Next</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function QctoQualificationsPage() {
  return (
    <Suspense fallback={<LoadingTable columns={8} rows={8} />}>
      <QctoQualificationsContent />
    </Suspense>
  );
}
