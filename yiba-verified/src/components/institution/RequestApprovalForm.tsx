"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RequestApprovalFormProps {
  requestId: string;
}

/**
 * RequestApprovalForm Component
 * 
 * Client component for approving or rejecting a QCTO request.
 * Handles form submission to PATCH /api/institutions/requests/[requestId]
 */
export function RequestApprovalForm({ requestId }: RequestApprovalFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!status) {
      setError("Please select approve or reject");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/institutions/requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          response_notes: responseNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${status === "APPROVED" ? "approve" : "reject"} request`);
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
          <Label htmlFor="status">Decision</Label>
          <div className="flex gap-4 mt-2">
            <Button
              type="button"
              variant={status === "APPROVED" ? "default" : "outline"}
              onClick={() => setStatus("APPROVED")}
              disabled={isSubmitting}
              className="flex-1"
            >
              ✓ Approve
            </Button>
            <Button
              type="button"
              variant={status === "REJECTED" ? "destructive" : "outline"}
              onClick={() => setStatus("REJECTED")}
              disabled={isSubmitting}
              className="flex-1"
            >
              ✗ Reject
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {status === "APPROVED" && "Approving this request grants QCTO access to the requested resources."}
            {status === "REJECTED" && "Rejecting this request denies QCTO access to the requested resources."}
            {!status && "Select whether to approve or reject this request."}
          </p>
        </div>

        <div>
          <Label htmlFor="response_notes">Response Notes (Optional)</Label>
          <textarea
            id="response_notes"
            placeholder="Add any notes or comments about your decision..."
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Optional notes explaining your decision. This will be visible to QCTO.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={!status || isSubmitting}
          variant={status === "REJECTED" ? "destructive" : "default"}
        >
          {isSubmitting
            ? `${status === "APPROVED" ? "Approving" : "Rejecting"}...`
            : status === "APPROVED"
            ? "Approve Request"
            : status === "REJECTED"
            ? "Reject Request"
            : "Submit Decision"}
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
