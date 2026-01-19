"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddResourceFormProps {
  submissionId: string;
}

/**
 * AddResourceForm Component
 * 
 * Client component for adding a resource to a submission.
 * Handles form submission to POST /api/institutions/submissions/[submissionId]/resources
 */
export function AddResourceForm({ submissionId }: AddResourceFormProps) {
  const router = useRouter();
  const [resourceType, setResourceType] = useState<"LEARNER" | "ENROLMENT" | "READINESS" | "DOCUMENT" | "INSTITUTION">("LEARNER");
  const [resourceIdValue, setResourceIdValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resourceIdValue.trim()) {
      setError("Resource ID is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/institutions/submissions/${submissionId}/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resource_type: resourceType,
          resource_id_value: resourceIdValue.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add resource");
      }

      // Reset form and refresh page
      setResourceIdValue("");
      setNotes("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="resource_type">Resource Type</Label>
          <select
            id="resource_type"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as any)}
            disabled={isSubmitting}
            className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="LEARNER">Learner</option>
            <option value="ENROLMENT">Enrolment</option>
            <option value="READINESS">Readiness Assessment</option>
            <option value="DOCUMENT">Document</option>
            <option value="INSTITUTION">Institution</option>
          </select>
        </div>

        <div>
          <Label htmlFor="resource_id_value">Resource ID</Label>
          <Input
            id="resource_id_value"
            type="text"
            placeholder="Enter resource ID (learner_id, enrolment_id, etc.)"
            value={resourceIdValue}
            onChange={(e) => setResourceIdValue(e.target.value)}
            disabled={isSubmitting}
            className="mt-2"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            The ID of the resource to link (e.g., learner_id, enrolment_id)
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <textarea
          id="notes"
          placeholder="Add any notes about this resource..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || !resourceIdValue.trim()}
        >
          {isSubmitting ? "Adding..." : "Add Resource"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setResourceIdValue("");
            setNotes("");
            setError(null);
          }}
          disabled={isSubmitting}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
