"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FileUploadDropzone, type FileUploadProgress } from "@/components/shared/FileUploadDropzone";
import { Alert } from "@/components/ui/alert";

/**
 * DocumentUploadForm Component
 * 
 * Client component for uploading a new document.
 */
export function DocumentUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [relatedEntity, setRelatedEntity] = useState<string>("");
  const [relatedEntityId, setRelatedEntityId] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [relatedEntities, setRelatedEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);

  // Fetch related entities based on selected entity type
  useEffect(() => {
    if (!relatedEntity) {
      setRelatedEntities([]);
      setRelatedEntityId("");
      return;
    }

    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        let url = "";
        switch (relatedEntity) {
          case "INSTITUTION":
            // For institutions, use the current user's institution
            // We'll need to get this from session or pass as prop
            break;
          case "LEARNER":
            url = "/api/learners?limit=100";
            break;
          case "ENROLMENT":
            url = "/api/enrolments?limit=100";
            break;
          case "READINESS":
            url = "/api/institutions/readiness?limit=100";
            break;
        }

        if (url) {
          const response = await fetch(url);
          const data = await response.json();
          setRelatedEntities(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch entities:", err);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [relatedEntity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    // For INSTITUTION entity, we don't need relatedEntityId (API will use user's institution)
    const needsEntityId = relatedEntity && relatedEntity !== "INSTITUTION";
    
    if (!relatedEntity || (needsEntityId && !relatedEntityId) || !documentType) {
      setError("Please fill in all required fields");
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
      formData.append("related_entity", relatedEntity);
      // For INSTITUTION, API will derive institution_id from session (don't send related_entity_id)
      // For other entities, we need to provide related_entity_id
      if (relatedEntity !== "INSTITUTION") {
        formData.append("related_entity_id", relatedEntityId);
      }
      // API will automatically use ctx.institutionId for INSTITUTION entity type
      formData.append("document_type", documentType);

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
      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          
          setUploadProgress({
            file,
            progress: 100,
            status: "complete",
          });

          setSuccess(true);
          
          // Show success toast
          const { toast } = await import("sonner");
          toast.success("Document uploaded successfully!");

          // Redirect to document detail page after a short delay
          setTimeout(() => {
            router.push(`/institution/documents/${data.document_id}`);
          }, 1500);
        } else {
          const data = JSON.parse(xhr.responseText);
          const errorMessage = data.error || "Failed to upload document";
          setError(errorMessage);
          setUploadProgress({
            file,
            progress: 0,
            status: "error",
            error: errorMessage,
          });
          const { toast } = await import("sonner");
          toast.error(`Upload failed: ${errorMessage}`);
          setIsSubmitting(false);
        }
      });

      // Handle errors
      xhr.addEventListener("error", async () => {
        const errorMessage = "Network error occurred";
        setError(errorMessage);
        setUploadProgress({
          file,
          progress: 0,
          status: "error",
          error: errorMessage,
        });
        const { toast } = await import("sonner");
        toast.error(`Upload failed: ${errorMessage}`);
        setIsSubmitting(false);
      });

      xhr.open("POST", "/api/institutions/documents");
      xhr.send(formData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload document";
      setError(errorMessage);
      setUploadProgress({
        file,
        progress: 0,
        status: "error",
        error: errorMessage,
      });
      const { toast } = await import("sonner");
      toast.error(`Upload failed: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  const getEntityDisplayName = (entity: any, entityType: string) => {
    switch (entityType) {
      case "LEARNER":
        return `${entity.first_name} ${entity.last_name} (${entity.national_id})`;
      case "ENROLMENT":
        return `Enrolment ${entity.enrolment_id.substring(0, 8)}...`;
      case "READINESS":
        return `${entity.qualification_title} (${entity.saqa_id})`;
      default:
        return entity.id || entity[`${entityType.toLowerCase()}_id`];
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Document</CardTitle>
        <CardDescription>
          Add a document to the Evidence Vault. Documents are version-controlled and cannot be deleted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="related_entity">Related Entity *</Label>
            <Select
              value={relatedEntity}
              onValueChange={setRelatedEntity}
              disabled={isSubmitting}
            >
              <SelectTrigger id="related_entity">
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSTITUTION">Institution</SelectItem>
                <SelectItem value="LEARNER">Learner</SelectItem>
                <SelectItem value="ENROLMENT">Enrolment</SelectItem>
                <SelectItem value="READINESS">Readiness (Form 5)</SelectItem>
              </SelectContent>
            </Select>
            {relatedEntity === "INSTITUTION" && (
              <p className="text-xs text-muted-foreground">
                The document will be linked to your institution.
              </p>
            )}
          </div>

          {relatedEntity && relatedEntity !== "INSTITUTION" && (
            <div className="space-y-2">
              <Label htmlFor="related_entity_id">
                {relatedEntity === "LEARNER" && "Learner"}
                {relatedEntity === "ENROLMENT" && "Enrolment"}
                {relatedEntity === "READINESS" && "Readiness Record"} *
              </Label>
              {loadingEntities ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <Select
                  value={relatedEntityId}
                  onValueChange={setRelatedEntityId}
                  disabled={isSubmitting || relatedEntities.length === 0}
                >
                  <SelectTrigger id="related_entity_id">
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {relatedEntities.map((entity) => {
                      const idField = entity.learner_id || entity.enrolment_id || entity.readiness_id;
                      return (
                        <SelectItem key={idField} value={idField}>
                          {getEntityDisplayName(entity, relatedEntity)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
              {relatedEntities.length === 0 && !loadingEntities && (
                <p className="text-xs text-muted-foreground">
                  No {relatedEntity.toLowerCase()}s found. Create one first.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Input
              id="document_type"
              type="text"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="e.g., CV, Contract, Policy, Certificate"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Describe the type of document (e.g., CV, Contract, Policy, Certificate).
            </p>
          </div>

          {error && !uploadProgress && (
            <Alert variant="error" title="Upload Failed" description={error} />
          )}

          {success && (
            <Alert variant="success" title="Upload Successful" description="Document uploaded successfully! Redirecting..." />
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || !file || !relatedEntity || !documentType}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Uploading..." : "Upload Document"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/institution/documents")}
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
