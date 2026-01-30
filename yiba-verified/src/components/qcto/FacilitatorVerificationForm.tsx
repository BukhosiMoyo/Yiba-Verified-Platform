"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react";

interface FacilitatorVerificationFormProps {
  facilitatorId: string;
  currentStatus?: string | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function FacilitatorVerificationForm({
  facilitatorId,
  currentStatus,
  onSuccess,
  trigger,
}: FacilitatorVerificationFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(`/api/qcto/facilitators/${facilitatorId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verification_status: verificationStatus,
          verification_notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify facilitator");
      }

      toast.success(
        verificationStatus === "VERIFIED"
          ? "Facilitator verified successfully"
          : "Facilitator verification rejected"
      );
      setOpen(false);
      setNotes("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error verifying facilitator:", error);
      toast.error(error.message || "Failed to verify facilitator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            {currentStatus === "VERIFIED" ? "Update Verification" : "Verify Facilitator"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Facilitator</DialogTitle>
          <DialogDescription>
            Mark this facilitator as verified or rejected based on your review of their qualifications and documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification_status">Verification Status *</Label>
            <Select
              id="verification_status"
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value as "VERIFIED" | "REJECTED")}
              required
            >
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Verification Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about the verification decision..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {verificationStatus === "VERIFIED" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
