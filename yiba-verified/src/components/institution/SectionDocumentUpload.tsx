"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  Plus, 
  X, 
  Eye, 
  CheckCircle2, 
  Loader2, 
  Circle,
  AlertCircle,
  CloudUpload,
  FileUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DocumentVaultSelector } from "./DocumentVaultSelector";
import { DocumentViewModal } from "./DocumentViewModal";

interface Document {
  document_id: string;
  file_name: string;
  document_type?: string;
  mime_type?: string;
  file_size_bytes?: number;
  uploaded_at: Date | string;
  section_name?: string;
  criterion_key?: string;
}

interface UploadingFile {
  file: File;
  documentType: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

interface SectionDocumentUploadProps {
  sectionName: string;
  sectionNumber: number;
  requiredDocumentTypes: string[];
  readinessId: string;
  institutionId: string;
  qualificationTitle?: string;
  saqaId?: string;
  curriculumCode?: string;
  onDocumentUploaded: (documentId: string) => void;
  onDocumentRemoved: (documentId: string) => void;
  canEdit?: boolean;
}

/**
 * Section-Specific Document Upload Component - Redesigned
 * 
 * Features:
 * - Clear checklist showing uploaded vs pending documents
 * - Batch upload support (upload multiple files at once)
 * - Drag and drop support
 * - Progress tracking for each document type
 * - Visual completion indicator
 */
export function SectionDocumentUpload({
  sectionName,
  sectionNumber,
  requiredDocumentTypes,
  readinessId,
  institutionId,
  qualificationTitle,
  saqaId,
  curriculumCode,
  onDocumentUploaded,
  onDocumentRemoved,
  canEdit = true,
}: SectionDocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSectionDocuments();
  }, [readinessId, sectionName]);

  const fetchSectionDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/institutions/readiness/${readinessId}`);
      if (res.ok) {
        const data = await res.json();
        const sectionDocs = (data.documents || []).filter((doc: any) => {
          const docType = (doc.document_type || "").toUpperCase();
          return requiredDocumentTypes.some((reqType) => 
            docType.includes(reqType.toUpperCase().replace(/[^A-Z0-9]/g, "_")) ||
            reqType.toUpperCase().replace(/[^A-Z0-9]/g, "_").includes(docType)
          );
        });
        setDocuments(sectionDocs);
      }
    } catch (error) {
      console.error("Failed to fetch section documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a document type has been uploaded
  const isDocTypeUploaded = (docType: string): Document | undefined => {
    const docTypeUpper = docType.toUpperCase().replace(/[^A-Z0-9]/g, "_");
    return documents.find((doc) => {
      const uploadedType = (doc.document_type || "").toUpperCase();
      return uploadedType.includes(docTypeUpper) || docTypeUpper.includes(uploadedType);
    });
  };

  const uploadedCount = requiredDocumentTypes.filter((dt) => isDocTypeUploaded(dt)).length;
  const totalRequired = requiredDocumentTypes.length;
  const completionPercent = totalRequired > 0 ? Math.round((uploadedCount / totalRequired) * 100) : 0;

  // Handle file upload for a specific document type
  const handleUploadFile = async (file: File, documentType: string) => {
    const uploadId = `${file.name}-${Date.now()}`;
    
    setUploadingFiles((prev) => [...prev, {
      file,
      documentType,
      progress: 0,
      status: "uploading",
    }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      formData.append("section_name", sectionName);

      const response = await fetch(`/api/institutions/readiness/${readinessId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload");
      }

      const data = await response.json();
      
      setUploadingFiles((prev) => 
        prev.map((uf) => 
          uf.file === file && uf.documentType === documentType 
            ? { ...uf, progress: 100, status: "complete" }
            : uf
        )
      );
      
      toast.success(`${documentType} uploaded successfully`);
      onDocumentUploaded(data.document_id);
      fetchSectionDocuments();
      
      // Remove from uploading list after a delay
      setTimeout(() => {
        setUploadingFiles((prev) => 
          prev.filter((uf) => !(uf.file === file && uf.documentType === documentType))
        );
      }, 2000);
      
    } catch (error: any) {
      setUploadingFiles((prev) => 
        prev.map((uf) => 
          uf.file === file && uf.documentType === documentType 
            ? { ...uf, status: "error", error: error.message }
            : uf
        )
      );
      toast.error(`Failed to upload ${documentType}: ${error.message}`);
    }
  };

  const handleDocumentRemoved = async (documentId: string) => {
    try {
      const res = await fetch(`/api/institutions/readiness/${readinessId}/documents/${documentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments(documents.filter((d) => d.document_id !== documentId));
        onDocumentRemoved(documentId);
        toast.success("Document removed");
      } else {
        throw new Error("Failed to remove document");
      }
    } catch (error) {
      toast.error("Failed to remove document");
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, docType?: string) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && docType) {
      handleUploadFile(files[0], docType);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file, docType);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (requiredDocumentTypes.length === 0 && documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-blue-400/30 bg-blue-500/10 p-5">
      {/* Header with progress */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Documents for {sectionName}
          </h3>
        </div>
        
        {/* Completion Badge */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            completionPercent === 100 
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
          )}>
            {uploadedCount}/{totalRequired} uploaded
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalRequired > 0 && (
        <div className="mb-4">
          <Progress value={completionPercent} className="h-2" />
        </div>
      )}

      {/* Document Checklist - Each required document as a row */}
      <div className="space-y-2">
        {requiredDocumentTypes.map((docType, idx) => {
          const uploadedDoc = isDocTypeUploaded(docType);
          const isUploading = uploadingFiles.some((uf) => uf.documentType === docType && uf.status === "uploading");
          const uploadError = uploadingFiles.find((uf) => uf.documentType === docType && uf.status === "error");
          
          return (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-3 transition-all",
                uploadedDoc 
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20"
                  : isDragging
                    ? "border-blue-400 bg-blue-100/50 dark:border-blue-600 dark:bg-blue-900/30"
                    : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, docType)}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Status Icon + Document Type */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {uploadedDoc ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : isUploading ? (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      uploadedDoc ? "text-emerald-800 dark:text-emerald-200" : "text-foreground"
                    )}>
                      {docType}
                    </p>
                    
                    {/* Show uploaded file name */}
                    {uploadedDoc && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                        {uploadedDoc.file_name}
                      </p>
                    )}
                    
                    {/* Show upload error */}
                    {uploadError && (
                      <p className="text-xs text-destructive">
                        {uploadError.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {uploadedDoc ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setViewingDocument(uploadedDoc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDocumentRemoved(uploadedDoc.document_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  ) : canEdit && !isUploading ? (
                    <>
                      <input
                        type="file"
                        id={`file-${sectionNumber}-${idx}`}
                        className="hidden"
                        accept="application/pdf,image/*,.doc,.docx"
                        onChange={(e) => handleFileSelect(e, docType)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        onClick={() => document.getElementById(`file-${sectionNumber}-${idx}`)?.click()}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-2">
                  <Progress value={50} className="h-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Batch Upload Section */}
      {canEdit && uploadedCount < totalRequired && (
        <div className="mt-4 pt-4 border-t border-blue-200/30 dark:border-blue-800/30">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-2 border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-card h-12 font-medium text-blue-700 dark:text-blue-300"
              onClick={() => setUploadDialogOpen(true)}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              Upload Multiple Documents
            </Button>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Documents for {sectionName}</DialogTitle>
                <DialogDescription>
                  Upload all your documents at once. Select which document type each file belongs to.
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {/* Remaining documents to upload */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {totalRequired - uploadedCount} document{totalRequired - uploadedCount !== 1 ? 's' : ''} remaining
                      </p>
                    </div>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-6">
                      {requiredDocumentTypes.filter((dt) => !isDocTypeUploaded(dt)).map((dt, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Circle className="h-2 w-2" />
                          {dt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick upload for each remaining document */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Upload each document:</p>
                    {requiredDocumentTypes.filter((dt) => !isDocTypeUploaded(dt)).map((docType, idx) => {
                      const isUploading = uploadingFiles.some((uf) => uf.documentType === docType && uf.status === "uploading");
                      
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileUp className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">{docType}</span>
                          </div>
                          
                          <input
                            type="file"
                            id={`batch-file-${idx}`}
                            className="hidden"
                            accept="application/pdf,image/*,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadFile(file, docType);
                              }
                              e.target.value = "";
                            }}
                          />
                          
                          {isUploading ? (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => document.getElementById(`batch-file-${idx}`)?.click()}
                            >
                              <Upload className="h-3.5 w-3.5 mr-1.5" />
                              Choose File
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Vault Selection */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Or select from Document Vault</h4>
                    <DocumentVaultSelector
                      institutionId={institutionId}
                      readinessId={readinessId}
                      onSelect={async (documentId) => {
                        try {
                          const res = await fetch(`/api/institutions/readiness/${readinessId}/documents/link`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              document_id: documentId,
                              section_name: sectionName,
                            }),
                          });
                          if (res.ok) {
                            toast.success("Document linked successfully");
                            fetchSectionDocuments();
                          } else {
                            throw new Error("Failed to link document");
                          }
                        } catch (error) {
                          toast.error("Failed to link document");
                        }
                      }}
                    />
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* All Complete Message */}
      {completionPercent === 100 && (
        <div className="mt-4 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-sm font-medium">All documents uploaded for this section</p>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      <DocumentViewModal
        document={viewingDocument}
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
      />

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
