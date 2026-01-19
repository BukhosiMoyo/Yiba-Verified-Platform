"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

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
  /** Base path for filter navigation, e.g. /platform-admin/audit-logs or /qcto/audit-logs */
  basePath?: string;
}

/**
 * AuditLogFilters Component
 *
 * Client component for filtering audit logs.
 * Updates URL query parameters to filter results.
 */
export function AuditLogFilters({ searchParams, basePath = "/platform-admin/audit-logs" }: AuditLogFiltersProps) {
  const router = useRouter();
  const [filters, setFilters] = useState({
    entity_type: searchParams.entity_type || "",
    entity_id: searchParams.entity_id || "",
    change_type: searchParams.change_type || "",
    institution_id: searchParams.institution_id || "",
    changed_by: searchParams.changed_by || "",
    start_date: searchParams.start_date || "",
    end_date: searchParams.end_date || "",
  });

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    router.push(`${basePath}?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      entity_type: "",
      entity_id: "",
      change_type: "",
      institution_id: "",
      changed_by: "",
      start_date: "",
      end_date: "",
    });
    router.push(basePath);
  };

  return (
    <div className="rounded-xl border border-gray-200/60 bg-gray-50/30 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="entity_type" className="text-xs font-medium text-gray-500">
            Entity Type
          </Label>
          <Select
            id="entity_type"
            value={filters.entity_type}
            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
            className="h-9"
          >
            <option value="">All Entities</option>
            <option value="LEARNER">Learner</option>
            <option value="ENROLMENT">Enrolment</option>
            <option value="INSTITUTION">Institution</option>
            <option value="USER">User</option>
            <option value="READINESS">Readiness</option>
            <option value="DOCUMENT">Document</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="change_type" className="text-xs font-medium text-gray-500">
            Change Type
          </Label>
          <Select
            id="change_type"
            value={filters.change_type}
            onChange={(e) => setFilters({ ...filters, change_type: e.target.value })}
            className="h-9"
          >
            <option value="">All Changes</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="STATUS_CHANGE">Status Change</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="entity_id" className="text-xs font-medium text-gray-500">
            Entity ID
          </Label>
          <Input
            id="entity_id"
            type="text"
            placeholder="e.g., learner-123..."
            value={filters.entity_id}
            onChange={(e) => setFilters({ ...filters, entity_id: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="institution_id" className="text-xs font-medium text-gray-500">
            Institution ID
          </Label>
          <Input
            id="institution_id"
            type="text"
            placeholder="e.g., inst-123..."
            value={filters.institution_id}
            onChange={(e) => setFilters({ ...filters, institution_id: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="changed_by" className="text-xs font-medium text-gray-500">
            Changed By (User ID)
          </Label>
          <Input
            id="changed_by"
            type="text"
            placeholder="e.g., user-123..."
            value={filters.changed_by}
            onChange={(e) => setFilters({ ...filters, changed_by: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="start_date" className="text-xs font-medium text-gray-500">
            Start Date
          </Label>
          <DatePicker
            id="start_date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end_date" className="text-xs font-medium text-gray-500">
            End Date
          </Label>
          <DatePicker
            id="end_date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="h-9"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
        <Button variant="default" size="sm" onClick={applyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
