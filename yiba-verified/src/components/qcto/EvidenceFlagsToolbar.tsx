"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Search, List, LayoutGrid } from "lucide-react";
import Link from "next/link";

type ViewMode = "list" | "grid";

interface EvidenceFlagsToolbarProps {
  /** Current q (search), status, view from URL */
  q: string;
  status: string;
  view: ViewMode;
}

export function EvidenceFlagsToolbar({ q, status, view }: EvidenceFlagsToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pushParams = (updates: { q?: string; status?: string; view?: ViewMode }) => {
    const params = new URLSearchParams(searchParams.toString());
    (["q", "status", "view"] as const).forEach((k) => {
      const v = updates[k];
      if (v !== undefined) {
        if (v && v.trim()) params.set(k, v);
        else params.delete(k);
      }
    });
    router.push(`/qcto/evidence-flags?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <form
          className="flex flex-1 min-w-[200px] max-w-sm items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const v = (fd.get("q") as string)?.trim() || "";
            pushParams({ q: v });
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
            <Input
              name="q"
              placeholder="Search by document, reason, or who flagged..."
              defaultValue={q}
              className="h-9 pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>

        <Select
          value={status || "all"}
          onChange={(e) => pushParams({ status: e.target.value === "all" ? "" : e.target.value })}
          className="h-9 w-[140px]"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
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
