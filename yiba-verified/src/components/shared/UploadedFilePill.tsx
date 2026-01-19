"use client";

import * as React from "react";
import { File, FileText, Image, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface UploadedFilePillProps {
  file: File;
  status?: "idle" | "uploading" | "complete" | "error";
  progress?: number; // 0-100, only used when status is "uploading"
  error?: string;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * UploadedFilePill Component
 * 
 * Premium pill-style card for displaying uploaded files with status, progress, and actions.
 * 
 * @example
 * ```tsx
 * <UploadedFilePill
 *   file={selectedFile}
 *   status="uploading"
 *   progress={45}
 *   onRemove={() => setFile(null)}
 * />
 * ```
 */
export function UploadedFilePill({
  file,
  status = "idle",
  progress,
  error,
  onRemove,
  disabled,
  className,
}: UploadedFilePillProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (): { type: string; icon: React.ReactNode } => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const mimeType = file.type;

    if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return {
        type: "IMAGE",
        icon: <Image className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />,
      };
    }
    if (mimeType === "application/pdf" || extension === "pdf") {
      return {
        type: "PDF",
        icon: <FileText className="h-3.5 w-3.5 text-red-600" strokeWidth={2} />,
      };
    }
    return {
      type: "FILE",
      icon: <File className="h-3.5 w-3.5 text-gray-600" strokeWidth={2} />,
    };
  };

  const fileType = getFileType();
  const fileSize = formatFileSize(file.size);

  const getStatusBadge = () => {
    if (status === "uploading") {
      return (
        <Badge variant="default" className="text-xs px-2 py-0.5 h-5">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Uploading
        </Badge>
      );
    }
    if (status === "complete") {
      return (
        <Badge variant="success" className="text-xs px-2 py-0.5 h-5">
          <CheckCircle2 className="h-3 w-3 mr-1" strokeWidth={2} />
          Complete
        </Badge>
      );
    }
    if (status === "error") {
      return (
        <Badge variant="destructive" className="text-xs px-2 py-0.5 h-5">
          <AlertCircle className="h-3 w-3 mr-1" strokeWidth={2} />
          Failed
        </Badge>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-gray-200/60 bg-white p-3 transition-all duration-200",
        "hover:border-gray-300 hover:bg-gray-50/50",
        status === "uploading" && "border-blue-200 bg-blue-50/20",
        status === "complete" && "border-green-200 bg-green-50/20",
        status === "error" && "border-red-200 bg-red-50/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* File Type Icon Chip */}
        <div className="shrink-0">
          <div
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-lg",
              fileType.type === "PDF" && "bg-red-50",
              fileType.type === "IMAGE" && "bg-blue-50",
              fileType.type === "FILE" && "bg-gray-100"
            )}
          >
            {fileType.icon}
          </div>
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {file.name}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-gray-500">{fileType.type}</span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-500">{fileSize}</span>
          </div>
        </div>

        {/* Status Badge */}
        {getStatusBadge() && (
          <div className="shrink-0">
            {getStatusBadge()}
          </div>
        )}

        {/* Remove Button */}
        {onRemove && !disabled && status !== "uploading" && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 h-7 w-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors duration-150 flex items-center justify-center"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {status === "uploading" && progress !== undefined && (
        <div className="mt-2.5 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {status === "error" && error && (
        <p className="mt-2 text-xs text-red-600 truncate">{error}</p>
      )}
    </div>
  );
}
