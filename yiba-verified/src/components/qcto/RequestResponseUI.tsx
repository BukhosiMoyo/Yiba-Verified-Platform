"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, FileText, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
// Removed unused import
// Based on previous file searches, `DocumentVaultSelector.tsx` exists.

import { addEvidenceToRequest, removeEvidenceFromRequest, submitRequestResponse } from "@/app/qcto/requests/actions";
import { DocumentVaultSelector } from "@/components/institution/DocumentVaultSelector";

interface EvidenceItem {
    link_id: string;
    document?: {
        document_id: string;
        file_name: string;
        mime_type?: string | null;
    } | null;
    submission?: {
        submission_id: string;
        title?: string | null;
    } | null;
}

interface RequestResponseUIProps {
    requestId: string;
    institutionId: string;
    status: string;
    evidenceLinks: EvidenceItem[];
    existingNotes?: string | null;
}

export function RequestResponseUI({ requestId, institutionId, status, evidenceLinks, existingNotes }: RequestResponseUIProps) {
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState(existingNotes || "");
    const [dialogOpen, setDialogOpen] = useState(false);

    const isLocked = ["APPROVED", "REJECTED", "CANCELLED", "SUBMITTED", "UNDER_REVIEW"].includes(status);
    const canSubmit = !isLocked && (evidenceLinks.length > 0 || notes.length > 0);

    const handleAddDocument = async (documentId: string) => {
        setLoading(true);
        try {
            const res = await addEvidenceToRequest(requestId, { documentId });
            if (res.success) {
                toast.success("Document added as evidence");
                setDialogOpen(false);
            } else {
                toast.error(res.error || "Failed to add document");
            }
        } catch (e) {
            toast.error("Error adding document");
        } finally {
            setLoading(false);
        }
    };

    // TODO: Add handleAddSubmission for Submissions linkage later

    const handleRemoveEvidence = async (linkId: string) => {
        if (confirm("Are you sure you want to remove this item?")) {
            setLoading(true);
            try {
                const res = await removeEvidenceFromRequest(linkId);
                if (res.success) {
                    toast.success("Evidence removed");
                } else {
                    toast.error(res.error || "Failed");
                }
            } catch (e) {
                toast.error("Error removing evidence");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!confirm("Are you sure you want to submit this response? You won't be able to edit it afterwards.")) return;

        setLoading(true);
        try {
            const res = await submitRequestResponse(requestId, notes);
            if (res.success) {
                toast.success("Response submitted successfully!");
            } else {
                toast.error(res.error || "Failed to submit");
            }
        } catch (e) {
            toast.error("Error submitting response");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* EVIDENCE LIST */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-muted-foreground">Attached Evidence</h3>
                    {!isLocked && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <Plus className="w-4 h-4 mr-2" /> Add Document
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Select Document</DialogTitle>
                                    <DialogDescription>Choose a document from your vault to attach as evidence.</DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                    <DocumentVaultSelector
                                        institutionId={institutionId}
                                        onSelect={handleAddDocument}
                                        label="Select Document"
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {evidenceLinks.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg bg-muted/50 text-sm text-muted-foreground">
                        No evidence documents attached.
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {evidenceLinks.map(item => (
                            <div key={item.link_id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">
                                            {item.document?.file_name || item.submission?.title || "Unknown Item"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.document ? "Document" : "Submission"}
                                        </div>
                                    </div>
                                </div>
                                {!isLocked && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                        onClick={() => handleRemoveEvidence(item.link_id)}
                                        disabled={loading}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RESPONSE NOTES */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Additional Notes</h3>
                <Textarea
                    placeholder="Add any clarification or comments for QCTO..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={isLocked || loading}
                    rows={4}
                />
            </div>

            {/* ACTION BUTTONS */}
            {!isLocked ? (
                <div className="pt-4 border-t flex justify-end gap-2">
                    <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="w-full sm:w-auto">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Send className="w-4 h-4 mr-2" />
                        Submit Response
                    </Button>
                </div>
            ) : (
                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Response Submitted</span>
                    </div>
                </div>
            )}
        </div>
    );
}
