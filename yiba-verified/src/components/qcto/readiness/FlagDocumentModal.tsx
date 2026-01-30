"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Flag } from "lucide-react";
import { toast } from "sonner";

interface FlagDocumentModalProps {
  readinessId: string;
  documentId: string;
  documentName: string;
  onClose: () => void;
  onComplete: () => void;
}

/**
 * Flag Document Modal Component
 * 
 * Allows QCTO reviewers to flag documents with reasons
 */
export function FlagDocumentModal({
  readinessId,
  documentId,
  documentName,
  onClose,
  onComplete,
}: FlagDocumentModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason for flagging this document");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/qcto/readiness/${readinessId}/documents/${documentId}/flag`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: reason.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to flag document");
      }

      toast.success("Document flagged successfully");
      onComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to flag document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag Document</DialogTitle>
          <DialogDescription>
            Flag the document "{documentName}" with a reason. This will be visible to the institution.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Reason for Flagging *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this document is being flagged (e.g., missing information, incorrect format, expired document, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="mt-2"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !reason.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Flag className="mr-2 h-4 w-4" />
              Flag Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
