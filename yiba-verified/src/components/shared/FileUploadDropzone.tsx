"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadedFilePill } from "./UploadedFilePill";

export interface FileUploadProgress {
  file: File;
  progress: number; // 0-100
  status: "uploading" | "complete" | "error";
  error?: string;
}

export interface FileUploadDropzoneProps {
  onFileSelect: (file: File | null) => void;
  onFileRemove?: (file: File) => void;
  acceptedFileTypes?: string; // e.g., "application/pdf,image/jpeg,image/png"
  maxFileSize?: number; // in bytes
  maxFileSizeMB?: number; // in MB (convenience prop)
  value?: File | null;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  showProgress?: boolean;
  uploadProgress?: FileUploadProgress;
}

/**
 * FileUploadDropzone Component
 * 
 * Premium drag-and-drop file upload zone with progress tracking.
 * 
 * @example
 * ```tsx
 * <FileUploadDropzone
 *   onFileSelect={(file) => setFile(file)}
 *   acceptedFileTypes="application/pdf,image/jpeg,image/png"
 *   maxFileSizeMB={10}
 *   value={selectedFile}
 * />
 * ```
 */
export function FileUploadDropzone({
  onFileSelect,
  onFileRemove,
  acceptedFileTypes = "application/pdf,image/jpeg,image/png,image/jpg",
  maxFileSize,
  maxFileSizeMB = 10,
  value,
  disabled,
  error,
  className,
  showProgress = false,
  uploadProgress,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const maxSize = maxFileSize || maxFileSizeMB * 1024 * 1024;
  const maxSizeMB = maxFileSizeMB || Math.round(maxSize / (1024 * 1024));

  // Parse accepted file types for display
  const getAcceptedExtensions = () => {
    const types = acceptedFileTypes.split(",").map((t) => t.trim());
    const extensions = new Set<string>();
    
    types.forEach((type) => {
      if (type.startsWith("image/")) {
        const ext = type.split("/")[1].toUpperCase();
        // Normalize jpg/jpeg
        if (ext === "JPG" || ext === "JPEG") {
          extensions.add("JPG");
        } else {
          extensions.add(ext);
        }
      } else if (type.startsWith("application/")) {
        if (type.includes("pdf")) extensions.add("PDF");
      }
    });
    
    const result = Array.from(extensions).join(", ");
    return result || "Various";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file size
    if (file.size > maxSize) {
      // Could trigger an error callback here if provided
      return;
    }

    // Validate file type (more lenient - check if file type matches any accepted type)
    if (acceptedFileTypes) {
      const acceptedTypes = acceptedFileTypes.split(",").map((t) => t.trim());
      const matches = acceptedTypes.some((type) => {
        // Exact match
        if (file.type === type) return true;
        // Pattern match (e.g., "image/*" matches "image/jpeg")
        if (type.endsWith("/*")) {
          const baseType = type.split("/")[0];
          return file.type.startsWith(baseType + "/");
        }
        return false;
      });
      
      if (!matches) {
        // Could trigger an error callback here if provided
        return;
      }
    }

    onFileSelect(file);
  };

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (value && onFileRemove) {
      onFileRemove(value);
    } else {
      onFileSelect(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  return (
    <div className={cn("space-y-3", className)}>
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!value ? handleBrowseClick : undefined}
        className={cn(
          "relative rounded-xl border-2 border-dashed p-8 transition-all duration-200",
          "bg-card border-border",
          isDragging && "border-primary bg-primary/10",
          !isDragging && !value && "hover:border-border-strong hover:bg-muted/50",
          value && "border-border-strong bg-muted/30",
          error && "border-destructive bg-destructive/10",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && !value && "cursor-pointer"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="File input"
        />

        {!value ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div
              className={cn(
                "rounded-full p-3 transition-colors duration-200",
                isDragging ? "bg-blue-100" : "bg-gray-100"
              )}
            >
              <Upload
                className={cn(
                  "h-6 w-6 transition-colors duration-200",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={1.5}
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {isDragging ? "Drop file here" : "Drag and drop a file"}
              </h3>
              <p className="text-xs text-muted-foreground">
                or{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowseClick();
                  }}
                  disabled={disabled}
                  className="text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline"
                >
                  browse files
                </button>
              </p>
            </div>
          </div>
        ) : (
          <UploadedFilePill
            file={value}
            status={showProgress && uploadProgress ? uploadProgress.status : "idle"}
            progress={showProgress && uploadProgress ? uploadProgress.progress : undefined}
            error={showProgress && uploadProgress ? uploadProgress.error : undefined}
            onRemove={handleRemove}
            disabled={disabled}
          />
        )}
      </div>

      {/* Hints */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span>Max size: {maxSizeMB}MB</span>
        <span className="text-muted-foreground/50">•</span>
        <span>Accepted: {getAcceptedExtensions()}</span>
      </div>
    </div>
  );
}
