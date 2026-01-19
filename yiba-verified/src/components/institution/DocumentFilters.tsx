"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            value={currentParams.related_entity || ""}
            onValueChange={(value) => handleFilterChange("related_entity", value)}
          >
            <SelectTrigger id="related_entity" className="h-9 text-sm">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Entities</SelectItem>
              <SelectItem value="INSTITUTION">Institution</SelectItem>
              <SelectItem value="LEARNER">Learner</SelectItem>
              <SelectItem value="ENROLMENT">Enrolment</SelectItem>
              <SelectItem value="READINESS">Readiness</SelectItem>
            </SelectContent>
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
            value={currentParams.status || ""}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger id="status" className="h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="UPLOADED">Uploaded</SelectItem>
              <SelectItem value="FLAGGED">Flagged</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
