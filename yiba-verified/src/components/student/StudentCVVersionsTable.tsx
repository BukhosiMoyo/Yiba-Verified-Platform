"use client";

import { useState } from "react";
import {
  Search,
  FilePlus,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Download,
  Share2,
  FileStack,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// TODO: Replace with real CV versions from API
export type CVVersionRow = {
  id: string;
  name: string;
  targetRole: string;
  visibility: "public" | "private";
  lastUpdated: string;
};

const VISIBILITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
] as const;

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "pm", label: "Project Management" },
  { value: "admin", label: "Admin" },
  { value: "support", label: "Support" },
] as const;

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50] as const;

export type StudentCVVersionsTableProps = {
  rows?: CVVersionRow[];
  /** When true, show empty state. Default: when rows are empty. */
  showEmptyState?: boolean;
  /** Selected row for preview; clicks and View set this. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Called when row dropdown "Download" is chosen. Passes row.id. */
  onDownloadCv?: (rowId: string) => void;
  /** Called when row dropdown "Share" is chosen. */
  onShareProfile?: () => void;
  /** Called when row Delete is chosen. Passes row.id. */
  onDelete?: (rowId: string) => void;
};

export function StudentCVVersionsTable({
  rows: rawRows = [],
  showEmptyState,
  selectedId = null,
  onSelect,
  onDownloadCv,
  onShareProfile,
  onDelete,
}: StudentCVVersionsTableProps) {
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // TODO: Replace with real filtering/pagination; for now filter in memory for UI demo
  const filtered = rawRows.filter((r) => {
    const q = search.toLowerCase();
    if (q && !r.name.toLowerCase().includes(q) && !r.targetRole.toLowerCase().includes(q))
      return false;
    if (visibility !== "all" && r.visibility !== visibility) return false;
    if (role !== "all") {
      const term = role === "pm" ? "project" : role;
      if (!r.targetRole.toLowerCase().includes(term)) return false;
    }
    return true;
  });
  const displayRows = filtered.slice(0, rowsPerPage);
  const isEmpty = displayRows.length === 0;
  const showEmpty = showEmptyState ?? isEmpty;

  return (
    <div className="space-y-4">
      {/* Filter bar: Search, Visibility, Role, Rows — one line with wrap */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
            <Input
              placeholder="Search CVs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
          </div>
          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-[120px] h-9 bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
          >
            {VISIBILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-[160px] h-9 bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select
            value={String(rowsPerPage)}
            onChange={(e) => setRowsPerPage(Number(e.target.value) as 10 | 20 | 50)}
            className="w-[90px] h-9 bg-white dark:bg-stone-800/50 border-stone-200 dark:border-stone-600 text-stone-900 dark:text-stone-100"
          >
            {ROWS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table or empty state */}
      {showEmpty ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center py-20 px-8 text-center rounded-xl border-2 border-dashed",
            "border-stone-200 dark:border-stone-700",
            "bg-muted/50 dark:bg-muted/30"
          )}
        >
          <div className="rounded-full p-4 bg-stone-100 dark:bg-stone-800/60 mb-4">
            <FileStack className="h-8 w-8 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
            No CV versions found
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-xs">
            Try adjusting your filters or create a new CV version to get started.
          </p>
          <Button size="sm" className="gap-1.5">
            <FilePlus className="h-4 w-4" strokeWidth={1.5} />
            Create CV Version
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          {/* Table header bar: Create CV Version on the right */}
          <div className="flex items-center justify-end px-4 py-2 border-b border-border bg-muted/50 dark:bg-muted/30 min-w-0">
            <Button variant="outline" size="sm" className="gap-1.5 border-stone-300 dark:border-stone-600">
              <FilePlus className="h-4 w-4" strokeWidth={1.5} />
              Create CV Version
            </Button>
          </div>
          <div className="overflow-x-auto min-h-0">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow className="border-stone-200 dark:border-stone-700 hover:bg-transparent">
                  <TableHead className="h-11 px-3 w-12 bg-muted/50 dark:bg-muted/30 text-muted-foreground font-semibold">
                    #
                  </TableHead>
                  <TableHead className="h-11 px-4 bg-muted/50 dark:bg-muted/30 text-stone-600 dark:text-stone-400 font-semibold">
                    CV Name
                  </TableHead>
                <TableHead className="h-11 px-4 bg-muted/50 dark:bg-muted/30 text-stone-600 dark:text-stone-400 font-semibold">
                  Target Role
                </TableHead>
                <TableHead className="h-11 px-4 bg-muted/50 dark:bg-muted/30 text-stone-600 dark:text-stone-400 font-semibold">
                  Visibility
                </TableHead>
                <TableHead className="h-11 px-4 bg-muted/50 dark:bg-muted/30 text-stone-600 dark:text-stone-400 font-semibold">
                  Last Updated
                </TableHead>
                <TableHead className="h-11 px-4 text-right bg-muted/50 dark:bg-muted/30 text-stone-600 dark:text-stone-400 font-semibold whitespace-nowrap sticky right-0 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.2)]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, index) => {
                const isSelected = selectedId === row.id;
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-stone-100 dark:border-stone-700/80 cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-muted/50 dark:hover:bg-muted/30"
                    )}
                    onClick={() => onSelect?.(isSelected ? null : row.id)}
                  >
                    <TableCell className="px-3 py-3 text-stone-500 dark:text-stone-400 text-sm tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-stone-900 dark:text-stone-100">
                      {row.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-stone-700 dark:text-stone-300">
                      {row.targetRole}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={row.visibility === "public" ? "default" : "secondary"}
                        className={cn(
                          "font-medium",
                          row.visibility === "public"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                            : "bg-stone-100 text-stone-600 dark:bg-stone-700/60 dark:text-stone-300 border-stone-200 dark:border-stone-600"
                        )}
                      >
                        {row.visibility}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-stone-500 dark:text-stone-400 text-sm">
                      {row.lastUpdated}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3 text-right whitespace-nowrap sticky right-0 z-10",
                        isSelected ? "bg-primary/5 dark:bg-primary/10" : "bg-card"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 border-stone-200 dark:border-stone-600"
                          onClick={() => onSelect?.(row.id)}
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 gap-1 border-stone-200 dark:border-stone-600">
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-stone-200 dark:border-stone-600 text-red-600 hover:bg-red-50 hover:border-red-200 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:border-red-900/50"
                          onClick={() => onDelete?.(row.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-stone-200 dark:border-stone-600">
                              <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[160px]">
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" strokeWidth={1.5} />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onDownloadCv?.(row.id)}>
                              <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onShareProfile?.()}>
                              <Share2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => onDelete?.(row.id)}
                              className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      )}
    </div>
  );
}
