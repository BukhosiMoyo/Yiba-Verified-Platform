"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface InlineDocumentUploadProps {
  readinessId: string;
  sectionName?: string;
  criterionKey?: string;
  onUploadComplete: (documentId: string) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  label?: string;
}

/**
 * Inline Document Upload Component
 * 
 * Allows institutions to upload documents directly within the form
 * without navigating away. Documents are immediately linked to the readiness record.
 */
export function InlineDocumentUpload({
  readinessId,
  sectionName,
  criterionKey,
  onUploadComplete,
  acceptedFileTypes = "application/pdf,image/*,.doc,.docx",
  maxFileSizeMB = 10,
  label = "Upload Document",
}: InlineDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds ${maxFileSizeMB}MB limit`);
      return;
    }

    setUploadedFile(file);
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", "READINESS_EVIDENCE");
      if (sectionName) {
        formData.append("section_name", sectionName);
      }
      if (criterionKey) {
        formData.append("criterion_key", criterionKey);
      }

      // Upload document
      const response = await fetch(`/api/institutions/readiness/${readinessId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload document");
      }

      const data = await response.json();
      setUploadedDocumentId(data.document_id);
      setUploadProgress(100);
      toast.success("Document uploaded successfully");
      onUploadComplete(data.document_id);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
      setUploadedFile(null);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setUploadedDocumentId(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {!uploadedFile ? (
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
            disabled={uploading}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-green-200/60 bg-green-50/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {uploading ? (
                <Loader2 className="h-5 w-5 text-green-600 animate-spin shrink-0" />
              ) : uploadedDocumentId ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-green-600 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-green-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-green-700">
                  {formatFileSize(uploadedFile.size)}
                  {uploadedDocumentId && " • Uploaded"}
                </p>
              </div>
            </div>
            {!uploading && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {uploading && (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-green-700 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Maximum file size: {maxFileSizeMB}MB. Accepted formats: PDF, Images, Word documents.
      </p>
    </div>
  );
}
