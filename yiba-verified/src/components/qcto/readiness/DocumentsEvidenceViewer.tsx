"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Flag,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { FlagDocumentModal } from "./FlagDocumentModal";

interface Document {
  document_id: string;
  file_name: string;
  document_type?: string;
  mime_type?: string;
  file_size_bytes?: number;
  uploaded_at: Date;
  status?: string;
  flags?: Array<{
    flag_id: string;
    reason: string;
    status: string;
    flagged_by: string;
    created_at: Date;
  }>;
}

interface DocumentsEvidenceViewerProps {
  readinessId: string;
  documents: Document[];
  onDocumentUpdate?: () => void;
}

/**
 * Documents & Evidence Viewer Component
 * 
 * Displays documents as interactive cards with actions:
 * - Preview in-app (PDF/image viewer)
 * - Download
 * - Flag with reason (opens modal)
 * - Mark as verified/accepted
 */
export function DocumentsEvidenceViewer({
  readinessId,
  documents,
  onDocumentUpdate,
}: DocumentsEvidenceViewerProps) {
  const [flaggingDocument, setFlaggingDocument] = useState<string | null>(null);
  const [verifyingDocument, setVerifyingDocument] = useState<string | null>(null);
  const [previewingDocument, setPreviewingDocument] = useState<string | null>(null);

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDocumentStatus = (doc: Document) => {
    // Check if document has active flags
    const activeFlags = doc.flags?.filter((f) => f.status === "FLAGGED") || [];
    if (activeFlags.length > 0) {
      return { label: "Flagged", variant: "destructive" as const };
    }
    // Check if document is verified
    if (doc.status === "ACCEPTED" || doc.flags?.some((f) => f.status === "VERIFIED")) {
      return { label: "Verified", variant: "default" as const };
    }
    return { label: "Submitted", variant: "outline" as const };
  };

  const handlePreview = async (documentId: string) => {
    setPreviewingDocument(documentId);
    try {
      // TODO: Implement document preview
      // For now, open download link
      window.open(`/api/documents/${documentId}/download`, "_blank");
    } catch (error) {
      toast.error("Failed to preview document");
    } finally {
      setPreviewingDocument(null);
    }
  };

  const handleDownload = (documentId: string, fileName: string) => {
    window.open(`/api/documents/${documentId}/download`, "_blank");
  };

  const handleFlag = (documentId: string) => {
    setFlaggingDocument(documentId);
  };

  const handleVerify = async (documentId: string) => {
    setVerifyingDocument(documentId);
    try {
      const response = await fetch(
        `/api/qcto/readiness/${readinessId}/documents/${documentId}/verify`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify document");
      }

      toast.success("Document marked as verified");
      onDocumentUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify document");
    } finally {
      setVerifyingDocument(null);
    }
  };

  const handleFlagComplete = () => {
    setFlaggingDocument(null);
    onDocumentUpdate?.();
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents & Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No documents uploaded for this readiness record.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-4 border-l-violet-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle>Documents & Evidence</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const status = getDocumentStatus(doc);
              const activeFlags = doc.flags?.filter((f) => f.status === "FLAGGED") || [];

              return (
                <div
                  key={doc.document_id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 p-4 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-900/50 transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <FileText className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate" title={doc.file_name}>
                            {doc.file_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={status.variant} className="text-xs">
                              {status.label}
                            </Badge>
                            {activeFlags.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {activeFlags.length} flag{activeFlags.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {doc.document_type || doc.mime_type || "Document"} • {formatFileSize(doc.file_size_bytes)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded: {formatDate(doc.uploaded_at)}</p>
                      </div>

                      {/* Document Flags */}
                      {activeFlags.length > 0 && (
                        <div className="mt-3 rounded-lg bg-red-50/50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/50 p-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-red-900 dark:text-red-300">Flagged Issues:</p>
                              {activeFlags.map((flag) => (
                                <p key={flag.flag_id} className="text-xs text-red-800 dark:text-red-400 mt-1">
                                  {flag.reason}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(doc.document_id)}
                          disabled={previewingDocument === doc.document_id}
                          className="h-7 text-xs"
                        >
                          {previewingDocument === doc.document_id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Eye className="h-3 w-3 mr-1" />
                          )}
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc.document_id, doc.file_name)}
                          className="h-7 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFlag(doc.document_id)}
                          disabled={flaggingDocument === doc.document_id}
                          className="h-7 text-xs"
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          Flag
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(doc.document_id)}
                          disabled={verifyingDocument === doc.document_id}
                          className="h-7 text-xs"
                        >
                          {verifyingDocument === doc.document_id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Flag Document Modal */}
      {flaggingDocument && (
        <FlagDocumentModal
          readinessId={readinessId}
          documentId={flaggingDocument}
          documentName={documents.find((d) => d.document_id === flaggingDocument)?.file_name || ""}
          onClose={() => setFlaggingDocument(null)}
          onComplete={handleFlagComplete}
        />
      )}
    </>
  );
}
