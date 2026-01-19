"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SubmissionEditFormProps {
  submission: {
    submission_id: string;
    title: string | null;
    submission_type: string | null;
    status: string;
  };
}

/**
 * SubmissionEditForm Component
 * 
 * Client component for editing and submitting a submission.
 * Handles form submission to PATCH /api/institutions/submissions/[submissionId]
 */
export function SubmissionEditForm({ submission }: SubmissionEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(submission.title || "");
  const [submissionType, setSubmissionType] = useState(submission.submission_type || "");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = submission.status === "DRAFT" || submission.status === "SUBMITTED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      setError("This submission cannot be edited");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updateData: any = {};
      
      // Only include fields that changed
      if (title !== (submission.title || "")) {
        updateData.title = title.trim() || null;
      }
      if (submissionType !== (submission.submission_type || "")) {
        updateData.submission_type = submissionType.trim() || null;
      }
      if (status) {
        updateData.status = status;
      }

      // If no changes, just refresh
      if (Object.keys(updateData).length === 0) {
        router.refresh();
        return;
      }

      const response = await fetch(`/api/institutions/submissions/${submission.submission_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update submission");
      }

      // Refresh the page to show updated status
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
        </div>

        {submission.status === "DRAFT" && (
          <div>
            <Label>Submit to QCTO</Label>
            <div className="mt-2">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  setStatus("SUBMITTED");
                  // Auto-submit when status is set to SUBMITTED
                  setTimeout(() => {
                    const form = document.querySelector("form");
                    if (form) form.requestSubmit();
                  }, 100);
                }}
                disabled={isSubmitting}
                className="w-full"
              >
                ✓ Submit to QCTO
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Submitting this submission to QCTO will change its status to SUBMITTED and make it available for QCTO review.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || !canSubmit}
        >
          {isSubmitting ? "Saving..." : status === "SUBMITTED" ? "Submit to QCTO" : "Save Changes"}
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
