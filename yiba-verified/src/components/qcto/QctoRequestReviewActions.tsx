"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { reviewRequest } from "@/app/qcto/requests/actions";

interface QctoRequestReviewActionsProps {
    requestId: string;
    currentStatus: string;
}

export function QctoRequestReviewActions({ requestId, currentStatus }: QctoRequestReviewActionsProps) {
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<"APPROVED" | "REJECTED" | "RETURNED_FOR_CORRECTION" | null>(null);
    const [notes, setNotes] = useState("");
    const [open, setOpen] = useState(false);

    const handleOpen = (act: typeof action) => {
        setAction(act);
        setNotes("");
        setOpen(true);
    };

    const handleSubmit = async () => {
        if (!action) return;
        setLoading(true);
        try {
            const res = await reviewRequest(requestId, action, notes);
            if (res.success) {
                toast.success(`Request ${action.toLowerCase().replace(/_/g, " ")} successfully`);
                setOpen(false);
            } else {
                toast.error(res.error || "Failed to update request");
            }
        } catch (error) {
            toast.error("Error processing review");
        } finally {
            setLoading(false);
        }
    };

    const isFinal = ["APPROVED", "REJECTED", "CANCELLED"].includes(currentStatus);

    if (isFinal) {
        return null; // Don't show actions if finalized
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {action === "APPROVED" && "Approve Request"}
                            {action === "REJECTED" && "Reject Request"}
                            {action === "RETURNED_FOR_CORRECTION" && "Return for Correction"}
                        </DialogTitle>
                        <DialogDescription>
                            {action === "APPROVED" && "Are you sure you want to approve this request? This will mark it as complete."}
                            {action === "REJECTED" && "Are you sure you want to reject this request? This action cannot be undone."}
                            {action === "RETURNED_FOR_CORRECTION" && "This will send the request back to the institution for amendments."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">
                            Review Notes {action !== "APPROVED" && <span className="text-destructive">*</span>}
                        </label>
                        <Textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add reason or feedback..."
                            rows={4}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                        <Button
                            variant={action === "REJECTED" ? "destructive" : "default"}
                            onClick={handleSubmit}
                            disabled={loading || (action !== "APPROVED" && !notes.trim())}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                onClick={() => handleOpen("APPROVED")}
            >
                <CheckCircle className="w-4 h-4 mr-2" /> Approve
            </Button>

            <Button
                variant="outline"
                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                onClick={() => handleOpen("RETURNED_FOR_CORRECTION")}
            >
                <RotateCcw className="w-4 h-4 mr-2" /> Return
            </Button>

            <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleOpen("REJECTED")}
            >
                <XCircle className="w-4 h-4 mr-2" /> Reject
            </Button>
        </div>
    );
}
