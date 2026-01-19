"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * CreateSubmissionForm Component
 * 
 * Client component for creating a new submission.
 * Handles form submission to POST /api/institutions/submissions
 */
export function CreateSubmissionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [submissionType, setSubmissionType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/institutions/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || undefined,
          submission_type: submissionType.trim() || undefined,
          // Resources can be added later via the detail page
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create submission");
      }

      const submission = await response.json();

      // Redirect to the new submission detail page
      router.push(`/institution/submissions/${submission.submission_id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title (Optional)</Label>
          <Input
            id="title"
            type="text"
            placeholder="Compliance Pack 2024"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            A descriptive title for this submission
          </p>
        </div>

        <div>
          <Label htmlFor="submission_type">Submission Type (Optional)</Label>
          <Input
            id="submission_type"
            type="text"
            placeholder="COMPLIANCE_PACK, READINESS, ANNUAL_REPORT"
            value={submissionType}
            onChange={(e) => setSubmissionType(e.target.value)}
            disabled={isSubmitting}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Type of submission (e.g., COMPLIANCE_PACK, READINESS, ANNUAL_REPORT)
          </p>
        </div>

        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200">
          <p className="font-medium">Note:</p>
          <p className="mt-1">
            The submission will be created as a DRAFT. You can add resources and submit it to QCTO from the submission details page.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Submission"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
