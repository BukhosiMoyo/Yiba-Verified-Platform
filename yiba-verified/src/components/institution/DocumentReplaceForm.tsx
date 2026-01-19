"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FileUploadDropzone, type FileUploadProgress } from "@/components/shared/FileUploadDropzone";
import { Alert } from "@/components/ui/alert";

interface DocumentReplaceFormProps {
  documentId: string;
}

/**
 * DocumentReplaceForm Component
 * 
 * Client component for replacing a document with a new version.
 */
export function DocumentReplaceForm({ documentId }: DocumentReplaceFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Initialize upload progress
    setUploadProgress({
      file,
      progress: 0,
      status: "uploading",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress({
            file,
            progress,
            status: "uploading",
          });
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          
          setUploadProgress({
            file,
            progress: 100,
            status: "complete",
          });

          setSuccess(true);
          
          // Show success toast
          toast.success(`Document replaced! New version ${data.version} created.`);

          // Redirect to new version after a short delay
          setTimeout(() => {
            router.push(`/institution/documents/${data.document_id}`);
          }, 1500);
        } else {
          const data = JSON.parse(xhr.responseText);
          const errorMessage = data.error || "Failed to replace document";
          setError(errorMessage);
          setUploadProgress({
            file,
            progress: 0,
            status: "error",
            error: errorMessage,
          });
          toast.error(`Replace failed: ${errorMessage}`);
          setIsSubmitting(false);
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        const errorMessage = "Network error occurred";
        setError(errorMessage);
        setUploadProgress({
          file,
          progress: 0,
          status: "error",
          error: errorMessage,
        });
        toast.error(`Replace failed: ${errorMessage}`);
        setIsSubmitting(false);
      });

      xhr.open("PATCH", `/api/institutions/documents/${documentId}`);
      xhr.send(formData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to replace document";
      setError(errorMessage);
      setUploadProgress({
        file,
        progress: 0,
        status: "error",
        error: errorMessage,
      });
      toast.error(`Replace failed: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Replace Document</CardTitle>
        <CardDescription>
          Upload a new version of this document. The current version will be preserved, and a new version will be created.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">New File</Label>
            <FileUploadDropzone
              onFileSelect={setFile}
              acceptedFileTypes="application/pdf,image/jpeg,image/png,image/jpg"
              maxFileSizeMB={10}
              value={file}
              disabled={isSubmitting}
              error={!!error && !file}
              showProgress={isSubmitting && !!uploadProgress}
              uploadProgress={uploadProgress || undefined}
            />
            <p className="text-xs text-gray-500 mt-2">
              Select the file to replace the current document. This will create a new version.
            </p>
          </div>

          {error && !uploadProgress && (
            <Alert variant="error" title="Replace Failed" description={error} />
          )}

          {success && (
            <Alert variant="success" title="Document Replaced" description="Document replaced successfully! Redirecting to new version..." />
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || !file}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Uploading..." : "Replace Document"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
