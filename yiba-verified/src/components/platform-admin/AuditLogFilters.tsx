"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Filter, X } from "lucide-react";

type FilterState = {
  entity_type: string;
  entity_id: string;
  change_type: string;
  institution_id: string;
  changed_by: string;
  start_date: string;
  end_date: string;
};

interface AuditLogFiltersProps {
  searchParams: {
    entity_type?: string;
    entity_id?: string;
    change_type?: string;
    institution_id?: string;
    changed_by?: string;
    start_date?: string;
    end_date?: string;
  };
  basePath?: string;
}

const DEBOUNCE_MS = 400;

function toState(searchParams: AuditLogFiltersProps["searchParams"]): FilterState {
  return {
    entity_type: searchParams.entity_type || "",
    entity_id: searchParams.entity_id || "",
    change_type: searchParams.change_type || "",
    institution_id: searchParams.institution_id || "",
    changed_by: searchParams.changed_by || "",
    start_date: searchParams.start_date || "",
    end_date: searchParams.end_date || "",
  };
}

function toParams(f: FilterState): string {
  const p = new URLSearchParams();
  (Object.entries(f) as [keyof FilterState, string][]).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") p.set(k, String(v).trim());
  });
  return p.toString();
}

export function AuditLogFilters({ searchParams, basePath = "/platform-admin/audit-logs" }: AuditLogFiltersProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(() => toState(searchParams));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMountRef = useRef(false);
  const filtersRef = useRef<FilterState>(filters);
  filtersRef.current = filters;

  // Sync from URL when it changes externally (e.g. browser back)
  useEffect(() => {
    setFilters(toState(searchParams));
  }, [
    searchParams.entity_type,
    searchParams.entity_id,
    searchParams.change_type,
    searchParams.institution_id,
    searchParams.changed_by,
    searchParams.start_date,
    searchParams.end_date,
  ]);

  const apply = useCallback(
    (f: FilterState) => {
      const q = toParams(f);
      router.replace(q ? `${basePath}?${q}` : basePath);
    },
    [basePath, router]
  );

  // Autosave: debounced for text inputs (entity_id, institution_id, changed_by)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      apply(filtersRef.current);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters.entity_id, filters.institution_id, filters.changed_by, apply]);

  const updateAndApply = useCallback(
    (patch: Partial<FilterState>, applyNow: boolean) => {
      const next = { ...filters, ...patch };
      setFilters(next);
      if (applyNow) apply(next);
    },
    [filters, apply]
  );

  const clearFilters = useCallback(() => {
    const empty = toState({});
    setFilters(empty);
    router.replace(basePath);
  }, [basePath, router]);

  const hasActive = toParams(filters).length > 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filter audit logs</h2>
        </div>
        {hasActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 -mr-1">
            <X className="h-4 w-4 mr-1.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Entity & change */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entity_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Entity type
            </Label>
            <Select
              id="entity_type"
              value={filters.entity_type}
              onChange={(e) => updateAndApply({ entity_type: e.target.value }, true)}
              className="h-10 w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="">All entities</option>
              <option value="LEARNER">Learner</option>
              <option value="ENROLMENT">Enrolment</option>
              <option value="INSTITUTION">Institution</option>
              <option value="USER">User</option>
              <option value="READINESS">Readiness</option>
              <option value="DOCUMENT">Document</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="change_type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Change type
            </Label>
            <Select
              id="change_type"
              value={filters.change_type}
              onChange={(e) => updateAndApply({ change_type: e.target.value }, true)}
              className="h-10 w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="">All changes</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="STATUS_CHANGE">Status change</option>
            </Select>
          </div>
        </div>

        {/* IDs */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">IDs</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entity_id" className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Entity ID
              </Label>
              <Input
                id="entity_id"
                type="text"
                placeholder="e.g. learner-123"
                value={filters.entity_id}
                onChange={(e) => setFilters((p) => ({ ...p, entity_id: e.target.value }))}
                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution_id" className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Institution ID
              </Label>
              <Input
                id="institution_id"
                type="text"
                placeholder="e.g. inst-123"
                value={filters.institution_id}
                onChange={(e) => setFilters((p) => ({ ...p, institution_id: e.target.value }))}
                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="changed_by" className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Changed by (user ID)
              </Label>
              <Input
                id="changed_by"
                type="text"
                placeholder="e.g. user-123"
                value={filters.changed_by}
                onChange={(e) => setFilters((p) => ({ ...p, changed_by: e.target.value }))}
                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Date range */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date range</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-xs font-medium text-gray-500 dark:text-gray-400">
                From
              </Label>
              <DatePicker
                id="start_date"
                value={filters.start_date}
                onChange={(e) => updateAndApply({ start_date: e.target.value }, true)}
                placeholder="Start date"
                className="h-10 w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-xs font-medium text-gray-500 dark:text-gray-400">
                To
              </Label>
              <DatePicker
                id="end_date"
                value={filters.end_date}
                onChange={(e) => updateAndApply({ end_date: e.target.value }, true)}
                placeholder="End date"
                className="h-10 w-full rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
