"use client";

import { useState, useEffect, useRef } from "react";
import { Bug, AlertCircle, Lock, Lightbulb, HelpCircle, Loader2, CheckCircle2, Upload, X, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type IssueCategory = "BUG" | "DATA_ISSUE" | "ACCESS_ISSUE" | "FEATURE_REQUEST" | "OTHER";

const categories: {
  id: IssueCategory;
  label: string;
  description: string;
  icon: typeof Bug;
}[] = [
    {
      id: "BUG",
      label: "Bug",
      description: "Something isn't working correctly",
      icon: Bug,
    },
    {
      id: "DATA_ISSUE",
      label: "Data Issue",
      description: "Incorrect or missing data",
      icon: AlertCircle,
    },
    {
      id: "ACCESS_ISSUE",
      label: "Access Issue",
      description: "Can't access something I should",
      icon: Lock,
    },
    {
      id: "FEATURE_REQUEST",
      label: "Feature Request",
      description: "Suggestion for improvement",
      icon: Lightbulb,
    },
    {
      id: "OTHER",
      label: "Other",
      description: "Something else",
      icon: HelpCircle,
    },
  ];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

interface SelectedFile {
  file: File;
  preview?: string;
}

export function ReportIssueModal({ open, onOpenChange }: ReportIssueModalProps) {
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Capture current page URL on open
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      setPageUrl(window.location.href);
    }
  }, [open]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCategory(null);
        setTitle("");
        setDescription("");
        setPageUrl("");
        setSelectedFiles([]);
        setIsSuccess(false);
      }, 300);
    }
  }, [open]);

  // Clean up file previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: SelectedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large: ${file.name}. Max size is 10MB.`);
        continue;
      }

      // Create preview for images
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      newFiles.push({ file, preview });
    }

    // Limit to 3 files total
    const combinedFiles = [...selectedFiles, ...newFiles].slice(0, 3);
    setSelectedFiles(combinedFiles);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the issue first
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          pageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit issue");
        return;
      }

      const { issue } = await res.json();

      // Upload attachments if any
      if (selectedFiles.length > 0) {
        for (const { file } of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("issueId", issue.id);

          try {
            const uploadRes = await fetch("/api/issues/attachments", {
              method: "POST",
              body: formData,
            });

            if (!uploadRes.ok) {
              console.error("Failed to upload attachment:", file.name);
            }
          } catch (uploadError) {
            console.error("Failed to upload attachment:", uploadError);
          }
        }
      }

      setIsSuccess(true);
      toast.success("Issue reported successfully!");
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to submit issue:", error);
      toast.error("Failed to submit issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs, data issues, or suggestions.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Thank you for your report!
            </h3>
            <p className="text-sm text-muted-foreground">
              Our team will review your issue and get back to you if needed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category selection */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all",
                        category === cat.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          category === cat.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                        strokeWidth={1.5}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          category === cat.id
                            ? "text-primary"
                            : "text-foreground"
                        )}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Short Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Can't upload documents"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue in detail. What were you trying to do? What happened instead?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Page URL (auto-captured) */}
            <div className="space-y-2">
              <Label htmlFor="pageUrl" className="text-muted-foreground">
                Page URL (auto-captured)
              </Label>
              <Input
                id="pageUrl"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                className="text-xs text-muted-foreground bg-muted"
                readOnly
              />
            </div>

            {/* Screenshot / File Upload */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Screenshots (optional)
              </Label>

              {/* File previews */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedFiles.map((sf, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg overflow-hidden bg-muted"
                    >
                      {sf.preview ? (
                        <img
                          src={sf.preview}
                          alt={sf.file.name}
                          className="h-20 w-20 object-cover"
                        />
                      ) : (
                        <div className="h-20 w-20 flex flex-col items-center justify-center p-2">
                          <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                            {sf.file.name.slice(0, 10)}...
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                        {formatFileSize(sf.file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {selectedFiles.length < 3 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Add screenshots
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click to upload images or PDF (max 10MB each, up to 3 files)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!category || !title.trim() || !description.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
