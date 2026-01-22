"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Search, X } from "lucide-react";

type ReadinessFilterBarProps = {
  total: number;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "RETURNED_FOR_CORRECTION", label: "Returned for correction" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "RECOMMENDED", label: "Recommended" },
  { value: "REJECTED", label: "Rejected" },
];

const DELIVERY_OPTIONS = [
  { value: "", label: "All delivery modes" },
  { value: "FACE_TO_FACE", label: "Face to face" },
  { value: "BLENDED", label: "Blended" },
  { value: "MOBILE", label: "Mobile" },
];

const SORT_OPTIONS = [
  { value: "updated_desc", label: "Newest first" },
  { value: "updated_asc", label: "Oldest first" },
  { value: "title_asc", label: "Qualification A–Z" },
  { value: "title_desc", label: "Qualification Z–A" },
];

export function ReadinessFilterBar({ total }: ReadinessFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const delivery = searchParams.get("delivery") || "";
  const sort = searchParams.get("sort") || "updated_desc";
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const applySearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const v = searchInput.trim();
    if (v) params.set("q", v);
    else params.delete("q");
    if (status) params.set("status", status);
    if (delivery) params.set("delivery", delivery);
    params.set("sort", sort);
    router.push(`/institution/readiness?${params.toString()}`);
  }, [searchInput, status, delivery, sort, router, searchParams]);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    router.push("/institution/readiness");
  }, [router]);

  const hasActiveFilters =
    (searchParams.get("q") || "").trim() !== "" ||
    (searchParams.get("status") || "") !== "" ||
    (searchParams.get("delivery") || "") !== "" ||
    (searchParams.get("sort") || "updated_desc") !== "updated_desc";

  const onSelectChange = (key: "status" | "delivery" | "sort", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "status") {
      if (value) params.set("status", value);
      else params.delete("status");
    } else if (key === "delivery") {
      if (value) params.set("delivery", value);
      else params.delete("delivery");
    } else {
      params.set("sort", value);
    }
    if (q) params.set("q", q);
    router.push(`/institution/readiness?${params.toString()}`);
  };

  return (
    <div className="border-b border-slate-200/80 bg-gradient-to-r from-indigo-50/60 to-white px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <Label className="text-slate-600 text-xs font-medium mb-1 block">Search</Label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Qualification, SAQA ID, curriculum…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applySearch())}
                className="pl-9 h-10 border-slate-200/80"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={applySearch} className="h-10 shrink-0 border-slate-200/80">
              Search
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-slate-600 text-xs font-medium mb-1 block">Status</Label>
          <Select value={status} onChange={(e) => onSelectChange("status", e.target.value)} className="w-[180px] h-10 border-slate-200/80">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "_"} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-slate-600 text-xs font-medium mb-1 block">Delivery</Label>
          <Select value={delivery} onChange={(e) => onSelectChange("delivery", e.target.value)} className="w-[160px] h-10 border-slate-200/80">
            {DELIVERY_OPTIONS.map((o) => (
              <option key={o.value || "_"} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label className="text-slate-600 text-xs font-medium mb-1 block">Sort</Label>
          <Select value={sort} onChange={(e) => onSelectChange("sort", e.target.value)} className="w-[180px] h-10 border-slate-200/80">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
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
        {total} record{total !== 1 ? "s" : ""} found
        {q ? ` matching "${q}"` : ""}
      </div>
    </div>
  );
}
