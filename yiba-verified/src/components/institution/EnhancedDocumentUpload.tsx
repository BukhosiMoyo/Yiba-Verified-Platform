"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { suggestDocumentName, isFilenameSimilar, formatDocumentType } from "@/lib/documentNaming";
import type { DocumentNamingContext } from "@/lib/documentNaming";

interface EnhancedDocumentUploadProps {
  readinessId: string;
  sectionName: string;
  sectionNumber: number;
  requiredDocumentTypes: string[];
  qualificationTitle?: string;
  saqaId?: string;
  curriculumCode?: string;
  onUploadComplete: (documentId: string) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
}

/**
 * Enhanced Document Upload Component
 * 
 * Features:
 * - Document type selection dropdown
 * - Filename suggestion based on context
 * - Option to rename if filename doesn't match suggestion
 */
export function EnhancedDocumentUpload({
  readinessId,
  sectionName,
  sectionNumber,
  requiredDocumentTypes,
  qualificationTitle,
  saqaId,
  curriculumCode,
  onUploadComplete,
  acceptedFileTypes = "application/pdf,image/*,.doc,.docx",
  maxFileSizeMB = 10,
}: EnhancedDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [suggestedFileName, setSuggestedFileName] = useState<string>("");
  const [finalFileName, setFinalFileName] = useState<string>("");
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

    setSelectedFile(file);
    setFinalFileName(file.name);
  };

  const handleDocumentTypeSelect = (docType: string) => {
    setSelectedDocumentType(docType);
    
    if (selectedFile) {
      // Generate suggested filename
      const context: DocumentNamingContext = {
        documentType: docType,
        sectionName,
        sectionNumber,
        qualificationTitle,
        saqaId,
        curriculumCode,
      };
      const suggested = suggestDocumentName(context);
      setSuggestedFileName(suggested);
      
      // Check if current filename is similar to suggestion
      const isSimilar = isFilenameSimilar(selectedFile.name, suggested);
      if (!isSimilar) {
        setShowRenameDialog(true);
      } else {
        setFinalFileName(suggested);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) {
      toast.error("Please select a file and document type");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", selectedDocumentType);
      formData.append("section_name", sectionName);
      if (finalFileName !== selectedFile.name) {
        formData.append("suggested_file_name", finalFileName);
      }

      const response = await fetch(`/api/institutions/readiness/${readinessId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload document");
      }

      const data = await response.json();
      setUploadProgress(100);
      toast.success("Document uploaded successfully");
      onUploadComplete(data.document_id);
      
      // Reset
      setSelectedFile(null);
      setSelectedDocumentType("");
      setFinalFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label>Which document is this? *</Label>
        <Select
          value={selectedDocumentType}
          onChange={(e) => handleDocumentTypeSelect(e.target.value)}
        >
          {requiredDocumentTypes.map((docType) => (
            <option key={docType} value={docType}>
              {formatDocumentType(docType)}
            </option>
          ))}
        </Select>
      </div>

      {/* File Selection */}
      <div className="space-y-2">
        <Label>Select File *</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
            disabled={uploading || !selectedDocumentType}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !selectedDocumentType}
          >
            <Upload className="h-4 w-4 mr-2" />
            Browse
          </Button>
        </div>
      </div>

      {/* Selected File Display */}
      {selectedFile && (
        <div className="rounded-lg border border-blue-200/60 bg-blue-50/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-blue-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-blue-700">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            {!uploading && (
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                setSelectedFile(null);
                setFinalFileName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {uploading && (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-blue-700 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && selectedDocumentType && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document?</DialogTitle>
            <DialogDescription>
              We suggest renaming this file for better organization. The suggested name makes it easier for you and QCTO to identify the document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current filename</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedFile?.name}</p>
            </div>
            <div>
              <Label>Suggested filename</Label>
              <Input
                value={finalFileName}
                onChange={(e) => setFinalFileName(e.target.value)}
                placeholder={suggestedFileName}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suggested: {suggestedFileName}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFinalFileName(selectedFile?.name || "");
              setShowRenameDialog(false);
            }}>
              Keep Original
            </Button>
            <Button onClick={() => {
              if (!finalFileName) setFinalFileName(suggestedFileName);
              setShowRenameDialog(false);
            }}>
              Use Suggested Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
