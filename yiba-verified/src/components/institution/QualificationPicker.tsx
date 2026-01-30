"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QualificationOverviewInstitution } from "@/components/institution/QualificationOverviewInstitution";
import type { InstitutionQualificationSafe } from "@/components/institution/QualificationOverviewInstitution";
import { GraduationCap, Loader2, Eye } from "lucide-react";

export type QualificationRegistryItem = {
  id: string;
  name: string;
  code?: string | null;
  saqa_id?: string | null;
  curriculum_code?: string | null;
  nqf_level?: number | null;
  credits?: number | null;
  occupational_category?: string | null;
};

interface QualificationPickerProps {
  value: QualificationRegistryItem | null;
  onSelect: (item: QualificationRegistryItem | null) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  apiPath?: string;
  "data-testid"?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 1;

export function QualificationPicker({
  value,
  onSelect,
  disabled = false,
  placeholder = "Search qualifications by name, SAQA ID, or curriculum code…",
  label = "Qualification",
  apiPath = "/api/qcto/qualifications",
}: QualificationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QualificationRegistryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<InstitutionQualificationSafe | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(
    async (q: string) => {
      setListError(null);
      setLoading(true);
      const trimmed = q.trim();
      try {
        const url =
          trimmed.length >= SEARCH_MIN_LENGTH
            ? `${apiPath}?q=${encodeURIComponent(trimmed)}&limit=20`
            : `${apiPath}?limit=20`;
        const res = await fetch(url);
        if (!res.ok) {
          setListError("Could not load qualifications. Try again.");
          setResults([]);
          return;
        }
        const data = await res.json();
        setResults(data.items ?? []);
      } catch {
        setListError("Could not load qualifications. Try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [apiPath]
  );

  // Initial load when dropdown opens with empty query
  useEffect(() => {
    if (open && query === "") {
      fetchResults("");
    }
  }, [open, query, fetchResults]);

  // Debounced search when user types (non-empty query)
  useEffect(() => {
    if (query.length < SEARCH_MIN_LENGTH) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query);
      debounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value ? `${value.name}${value.saqa_id ? ` (${value.saqa_id})` : ""}` : "";

  const openDetails = useCallback(() => {
    if (!value?.id) return;
    setDetailsOpen(true);
    setDetailsData(null);
    setDetailsError(null);
    setDetailsLoading(true);
    fetch(`/api/institutions/qualifications/${value.id}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) return { error: "You don't have access to this qualification." };
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
  }, [value?.id]);

  return (
    <div ref={containerRef} className="relative space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap items-end gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onSelect(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin pointer-events-none" />
        )}
      </div>
      {value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openDetails}
          className="shrink-0"
        >
          <Eye className="h-4 w-4 mr-1" /> View details
        </Button>
      )}
      </div>
      {open && (query.length >= SEARCH_MIN_LENGTH || results.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-auto">
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b border-border"
            onClick={() => {
              onSelect(null);
              setQuery("");
              setOpen(false);
            }}
          >
            <span className="text-muted-foreground">Manual entry (unregistered qualification)</span>
          </button>
          {listError && (
            <div className="px-3 py-2 text-sm text-destructive border-b border-border">
              {listError}
            </div>
          )}
          {results.length === 0 && !loading && query.length >= SEARCH_MIN_LENGTH && !listError && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No qualifications found. Use manual entry above.
            </div>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-b border-border last:border-b-0"
              onClick={() => {
                onSelect(item);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {[item.saqa_id, item.curriculum_code, item.nqf_level != null ? `NQF ${item.nqf_level}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader className="space-y-1 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <SheetTitle className="text-foreground">Qualification details</SheetTitle>
            </div>
            <SheetDescription className="text-muted-foreground text-sm">
              View details for the selected qualification from the registry.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {detailsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {detailsError && !detailsLoading && (
              <p className="text-destructive text-sm">{detailsError}</p>
            )}
            {detailsData && !detailsLoading && (
              <QualificationOverviewInstitution qualification={detailsData} compact />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
