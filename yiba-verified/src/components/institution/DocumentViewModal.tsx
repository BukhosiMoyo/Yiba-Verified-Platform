"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, X } from "lucide-react";

interface Document {
  document_id: string;
  file_name: string;
  document_type?: string;
  mime_type?: string;
  file_size_bytes?: number;
  uploaded_at: Date | string;
}

interface DocumentViewModalProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Document View Modal
 * 
 * Displays document details and allows viewing/downloading
 */
export function DocumentViewModal({
  document,
  open,
  onOpenChange,
}: DocumentViewModalProps) {
  if (!document) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    // TODO: Implement actual file download
    // For now, show a message
    window.open(`/api/institutions/documents/${document.document_id}/download`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Details
          </DialogTitle>
          <DialogDescription>View document information and download</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{document.file_name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {document.document_type && (
                    <span className="inline-block mr-2">{document.document_type}</span>
                  )}
                  {document.mime_type && (
                    <span className="text-gray-500">• {document.mime_type}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">File Size</p>
              <p className="text-sm text-gray-900">{formatFileSize(document.file_size_bytes)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Uploaded</p>
              <p className="text-sm text-gray-900">{formatDate(document.uploaded_at)}</p>
            </div>
          </div>

          {/* Document Preview Placeholder */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600">Document preview coming soon</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
