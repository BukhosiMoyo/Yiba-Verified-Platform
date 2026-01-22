"use client";

import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Search, List, LayoutGrid, X } from "lucide-react";
import Link from "next/link";

type ViewMode = "list" | "grid";

interface EvidenceFlagsToolbarProps {
  q: string;
  status: string;
  view: ViewMode;
  onQChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function EvidenceFlagsToolbar({ q, status, view, onQChange, onStatusChange, onClear, hasActiveFilters }: EvidenceFlagsToolbarProps) {
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative w-48 sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
          <Input
            placeholder="Search by document, reason, or who flagged…"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={status || ""}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-[180px]"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-gray-200/80 p-0.5">
        <Link
          href={`/qcto/evidence-flags?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), view: "list" }).toString()}`}
        >
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1.5 px-2.5"
          >
            <List className="h-4 w-4" strokeWidth={1.5} />
            List
          </Button>
        </Link>
        <Link
          href={`/qcto/evidence-flags?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), view: "grid" }).toString()}`}
        >
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1.5 px-2.5"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
            Grid
          </Button>
        </Link>
      </div>
    </div>
  );
}
