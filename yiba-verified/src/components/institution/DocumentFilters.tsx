"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DocumentFiltersProps {
  currentParams: {
    related_entity?: string;
    related_entity_id?: string;
    document_type?: string;
    status?: string;
    q?: string;
  };
}

/**
 * DocumentFilters Component
 * 
 * Client component for filtering documents by entity, type, status, and search query.
 */
export function DocumentFilters({ currentParams }: DocumentFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim()) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("offset"); // Reset pagination when filters change
    router.push(`/institution/documents?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/institution/documents");
  };

  return (
    <div className="space-y-3 mb-6 pb-4 border-b border-gray-100/60">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</h3>
        {(currentParams.related_entity ||
          currentParams.document_type ||
          currentParams.status ||
          currentParams.q) && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="q" className="text-xs text-gray-600">Search</Label>
          <Input
            id="q"
            placeholder="File name, type..."
            value={currentParams.q || ""}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="related_entity" className="text-xs text-gray-600">Entity Type</Label>
          <Select
            id="related_entity"
            value={currentParams.related_entity || ""}
            onChange={(e) => handleFilterChange("related_entity", (e.target as HTMLSelectElement).value)}
            className="h-9 text-sm"
          >
            <option value="">All Entities</option>
            <option value="INSTITUTION">Institution</option>
            <option value="LEARNER">Learner</option>
            <option value="ENROLMENT">Enrolment</option>
            <option value="READINESS">Readiness</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="document_type" className="text-xs text-gray-600">Document Type</Label>
          <Input
            id="document_type"
            placeholder="e.g., CV, Contract..."
            value={currentParams.document_type || ""}
            onChange={(e) => handleFilterChange("document_type", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs text-gray-600">Status</Label>
          <Select
            id="status"
            value={currentParams.status || ""}
            onChange={(e) => handleFilterChange("status", (e.target as HTMLSelectElement).value)}
            className="h-9 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="FLAGGED">Flagged</option>
            <option value="ACCEPTED">Accepted</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
