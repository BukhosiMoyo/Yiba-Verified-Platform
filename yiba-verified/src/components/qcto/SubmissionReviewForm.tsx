"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, FileSearch, Check, X, RotateCcw, Paperclip, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ReviewAttachment = { attachment_id: string; file_name: string };

interface SubmissionReviewFormProps {
  submission: {
    submission_id: string;
    status: string;
    title: string | null;
  };
  reviewAttachments?: { attachment_id: string; file_name: string }[];
}

/**
 * SubmissionReviewForm Component
 * 
 * Client component for QCTO to review submissions.
 * Handles form submission to PATCH /api/qcto/submissions/[submissionId]
 */
const ACCEPT_FILES = "application/pdf,image/jpeg,image/png,image/gif,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function SubmissionReviewForm({ submission, reviewAttachments = [] }: SubmissionReviewFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RETURNED_FOR_CORRECTION" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [attachments, setAttachments] = useState<ReviewAttachment[]>(
    () => reviewAttachments.map((a) => ({ attachment_id: a.attachment_id, file_name: a.file_name }))
  );
  const [uploading, setUploading] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReview = submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW";

  const uploadUrl = `/api/qcto/submissions/${submission.submission_id}/review-attachments`;
  const baseAttachUrl = `/api/qcto/submissions/${submission.submission_id}/review-attachments`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large (max 10 MB)`);
        continue;
      }
      setUploading((u) => [...u, file.name]);
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch(uploadUrl, { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setAttachments((a) => [...a, { attachment_id: data.attachment_id, file_name: data.file_name }]);
        toast.success(`"${file.name}" attached`);
      } catch (err: any) {
        toast.error(`Failed to attach "${file.name}": ${err.message || "Upload failed"}`);
      } finally {
        setUploading((u) => u.filter((n) => n !== file.name));
      }
    }
    e.target.value = "";
  };

  const handleRemoveAttachment = async (a: ReviewAttachment) => {
    try {
      const res = await fetch(`${baseAttachUrl}/${a.attachment_id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to remove");
      }
      setAttachments((list) => list.filter((x) => x.attachment_id !== a.attachment_id));
      toast.success("Attachment removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove attachment");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canReview) {
      setError("This submission cannot be reviewed");
      return;
    }

    if (!status) {
      setError("Please select a review decision");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/qcto/submissions/${submission.submission_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          review_notes: reviewNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${status === "APPROVED" ? "approve" : status === "REJECTED" ? "reject" : "review"} submission`);
      }

      // Show success toast
      const statusMessages = {
        APPROVED: "Submission approved successfully!",
        REJECTED: "Submission rejected.",
        UNDER_REVIEW: "Submission marked as under review.",
        RETURNED_FOR_CORRECTION: "Submission returned for correction.",
      };
      toast.success(statusMessages[status] || "Review submitted successfully!");

      // Refresh the page to show updated status
      router.refresh();
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      setError(errorMessage);
      toast.error(`Failed to submit review: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  if (!canReview) {
    return null; // Don't show form if submission can't be reviewed
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
          <span className="font-medium">Error:</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="status">Review Decision</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              type="button"
              variant={status === "UNDER_REVIEW" ? "default" : "outline"}
              size="lg"
              onClick={() => setStatus("UNDER_REVIEW")}
              disabled={isSubmitting}
              className="flex-1 gap-2 h-12 text-base"
            >
              <FileSearch className="h-4 w-4 shrink-0" aria-hidden />
              Under Review
            </Button>
            <Button
              type="button"
              variant={status === "APPROVED" ? "default" : "outline"}
              size="lg"
              onClick={() => setStatus("APPROVED")}
              disabled={isSubmitting}
              className="flex-1 gap-2 h-12 text-base"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              Approve
            </Button>
            <Button
              type="button"
              variant={status === "REJECTED" ? "destructive" : "outline"}
              size="lg"
              onClick={() => setStatus("REJECTED")}
              disabled={isSubmitting}
              className="flex-1 gap-2 h-12 text-base"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Reject
            </Button>
            <Button
              type="button"
              variant={status === "RETURNED_FOR_CORRECTION" ? "default" : "outline"}
              size="lg"
              onClick={() => setStatus("RETURNED_FOR_CORRECTION")}
              disabled={isSubmitting}
              className="flex-1 gap-2 h-12 text-base"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
              Return for Correction
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {status === "APPROVED" && "Approving this submission grants QCTO access to all linked resources."}
            {status === "REJECTED" && "Rejecting this submission denies access. Institution will need to create a new submission."}
            {status === "RETURNED_FOR_CORRECTION" && "Returning for correction allows the institution to update and resubmit."}
            {status === "UNDER_REVIEW" && "Marking as under review indicates you are actively reviewing this submission."}
            {!status && "Select your review decision for this submission."}
          </p>
        </div>

        <div>
          <Label htmlFor="review_notes">Review Notes (Optional)</Label>
          <textarea
            id="review_notes"
            placeholder="Add any notes or comments about your review decision..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Optional notes explaining your review decision. This will be visible to the institution.
          </p>

          <div className="mt-4">
            <Label className="text-muted-foreground">Attachments (optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              PDF, images (JPEG, PNG, GIF, WebP), or Word (DOC, DOCX). Max 10 MB per file.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_FILES}
              multiple
              className="sr-only"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <Paperclip className="h-3.5 w-3.5" aria-hidden />
              Attach files
            </Button>

            {(attachments.length > 0 || uploading.length > 0) && (
              <ul className="mt-3 space-y-2">
                {attachments.map((a) => (
                  <li
                    key={a.attachment_id}
                    className="flex items-center justify-between gap-2 rounded-md border border-gray-200/60 bg-gray-50/50 px-3 py-2 text-sm"
                  >
                    <span className="truncate flex-1 min-w-0" title={a.file_name}>
                      {a.file_name}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <a
                        href={`${baseAttachUrl}/${a.attachment_id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground p-1 rounded"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(a)}
                        disabled={isSubmitting}
                        className="text-muted-foreground hover:text-destructive p-1 rounded disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
                {uploading.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-2 rounded-md border border-gray-200/60 bg-gray-50/50 px-3 py-2 text-sm text-muted-foreground"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
                    <span className="truncate">{name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={!status || isSubmitting}
          variant={status === "REJECTED" ? "destructive" : "default"}
          className="gap-2 h-11 min-w-[180px]"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : status === "APPROVED" ? (
            <Check className="h-4 w-4 shrink-0" aria-hidden />
          ) : status === "REJECTED" ? (
            <X className="h-4 w-4 shrink-0" aria-hidden />
          ) : status === "RETURNED_FOR_CORRECTION" ? (
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <FileSearch className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {isSubmitting
            ? `${status === "APPROVED" ? "Approving" : status === "REJECTED" ? "Rejecting" : status === "RETURNED_FOR_CORRECTION" ? "Returning" : "Reviewing"}...`
            : status === "APPROVED"
            ? "Approve submission"
            : status === "REJECTED"
            ? "Reject submission"
            : status === "RETURNED_FOR_CORRECTION"
            ? "Return for correction"
            : status === "UNDER_REVIEW"
            ? "Mark as under review"
            : "Submit review"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            setStatus(null);
            setReviewNotes("");
            setError(null);
          }}
          disabled={isSubmitting}
          className="gap-2 h-11"
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          Clear
        </Button>
      </div>
    </form>
  );
}
