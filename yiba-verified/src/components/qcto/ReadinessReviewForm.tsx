"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ReadinessReviewFormProps {
  readiness: {
    readiness_id: string;
    readiness_status: string;
    qualification_title: string | null;
  };
}

/**
 * ReadinessReviewForm Component
 * 
 * Client component for QCTO to review readiness records.
 * Handles form submission to PATCH /api/qcto/readiness/[readinessId]/review
 */
export function ReadinessReviewForm({ readiness }: ReadinessReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"UNDER_REVIEW" | "RECOMMENDED" | "REJECTED" | null>(null);
  const [recommendation, setRecommendation] = useState<"APPROVE" | "CONDITIONAL_APPROVAL" | "REJECT" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReview = readiness.readiness_status === "SUBMITTED" || readiness.readiness_status === "UNDER_REVIEW";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canReview) {
      setError("This readiness record cannot be reviewed");
      return;
    }

    if (!status) {
      setError("Please select a review status");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/qcto/readiness/${readiness.readiness_id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          recommendation: recommendation || undefined,
          remarks: remarks.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to review readiness record`);
      }

      // Show success toast
      const statusMessages = {
        UNDER_REVIEW: "Readiness record marked as under review.",
        RECOMMENDED: "Readiness record recommended successfully!",
        REJECTED: "Readiness record rejected.",
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
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-sm text-muted-foreground">
          This readiness record cannot be reviewed. Current status: {readiness.readiness_status}
        </p>
      </div>
    );
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
          <Label htmlFor="status">Review Status</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <Button
              type="button"
              variant={status === "UNDER_REVIEW" ? "default" : "outline"}
              onClick={() => setStatus("UNDER_REVIEW")}
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              Under Review
            </Button>
            <Button
              type="button"
              variant={status === "RECOMMENDED" ? "default" : "outline"}
              onClick={() => setStatus("RECOMMENDED")}
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              Recommend
            </Button>
            <Button
              type="button"
              variant={status === "REJECTED" ? "destructive" : "outline"}
              onClick={() => setStatus("REJECTED")}
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Reject
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {status === "UNDER_REVIEW" && "Marking as under review indicates you are actively reviewing this readiness record."}
            {status === "RECOMMENDED" && "Recommending this record indicates approval for programme delivery."}
            {status === "REJECTED" && "Rejecting this record requires corrections before approval."}
            {!status && "Select your review status for this readiness record."}
          </p>
        </div>

        {status && (
          <div>
            <Label htmlFor="recommendation">Recommendation (Optional)</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <Button
                type="button"
                variant={recommendation === "APPROVE" ? "default" : "outline"}
                onClick={() => setRecommendation("APPROVE")}
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                Approve
              </Button>
              <Button
                type="button"
                variant={recommendation === "CONDITIONAL_APPROVAL" ? "default" : "outline"}
                onClick={() => setRecommendation("CONDITIONAL_APPROVAL")}
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                Conditional
              </Button>
              <Button
                type="button"
                variant={recommendation === "REJECT" ? "destructive" : "outline"}
                onClick={() => setRecommendation("REJECT")}
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                Reject
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="remarks">Remarks / Comments (Optional)</Label>
          <textarea
            id="remarks"
            placeholder="Add any remarks or comments about your review decision..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Optional remarks explaining your review decision. This will be visible to the institution.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting || !status}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
