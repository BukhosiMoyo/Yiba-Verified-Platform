"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 300;

type LearnersFilterBarProps = { total: number };

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;

export function LearnersFilterBar({ total }: LearnersFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "name_asc";
  const limit = searchParams.get("limit") || "10";
  const [searchInput, setSearchInput] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMountRef = useRef(true);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const applySearch = useCallback(() => {
    const params = new URLSearchParams();
    const v = searchInput.trim();
    if (v) params.set("q", v);
    else params.delete("q");
    params.set("page", "1");
    params.set("limit", limit);
    params.set("sort", sort);
    router.push(`/institution/learners?${params.toString()}`);
  }, [searchInput, sort, limit, router]);

  // Debounce 300ms: on searchInput change, apply after 300ms. Skip first run (mount). Search button flushes immediately.
  useEffect(() => {
    if (didMountRef.current) {
      didMountRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      applySearch();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, applySearch]);

  const flushSearch = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    applySearch();
  };

  const clearFilters = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setSearchInput("");
    router.push("/institution/learners?page=1&limit=" + limit);
  }, [router, limit]);

  const hasActiveFilters = (searchParams.get("q") || "").trim() !== "" || (searchParams.get("sort") || "name_asc") !== "name_asc";

  const onSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.set("page", "1");
    if (q) params.set("q", q);
    params.set("limit", limit);
    router.push(`/institution/learners?${params.toString()}`);
  };

  return (
    <div className="border-b border-slate-200/80 bg-gradient-to-r from-amber-50/60 to-white px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <Label className="text-slate-600 text-xs font-medium mb-1 block">Search by name or ID</Label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Name, national ID, alternate ID…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), flushSearch())}
                className="pl-9 h-10 border-slate-200/80"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={flushSearch} className="h-10 shrink-0 border-slate-200/80">
              Search
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-slate-600 text-xs font-medium mb-1 block">Sort by</Label>
          <Select value={sort} onChange={(e) => onSortChange(e.target.value)} className="w-[180px] h-10 border-slate-200/80">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-rose-600">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="mt-3 text-sm text-slate-500">
        {total} learner{total !== 1 ? "s" : ""} found
        {q ? ` matching "${q}"` : ""}
      </div>
    </div>
  );
}
