"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileText, Loader2, Link as LinkIcon } from "lucide-react";

interface CreateDocumentRequestFormProps {
  institutionId: string;
  institutionName: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

type EntityType = "FACILITATOR" | "LEARNER" | "READINESS" | "INSTITUTION";

interface EntityOption {
  value: EntityType;
  label: string;
}

const ENTITY_OPTIONS: EntityOption[] = [
  { value: "FACILITATOR", label: "Facilitator" },
  { value: "LEARNER", label: "Learner" },
  { value: "READINESS", label: "Readiness Record" },
  { value: "INSTITUTION", label: "Institution" },
];

export function CreateDocumentRequestForm({
  institutionId,
  institutionName,
  onSuccess,
  trigger,
}: CreateDocumentRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentIds, setDocumentIds] = useState("");
  const [linkToProfile, setLinkToProfile] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>("FACILITATOR");
  const [entityId, setEntityId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!documentIds.trim()) {
      toast.error("At least one document ID is required");
      return;
    }

    if (linkToProfile && !entityId.trim()) {
      toast.error("Entity ID is required when linking to profile");
      return;
    }

    setLoading(true);

    try {
      // Parse document IDs (comma-separated or newline-separated)
      const docIds = documentIds
        .split(/[,\n]/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (docIds.length === 0) {
        toast.error("Please provide at least one valid document ID");
        setLoading(false);
        return;
      }

      // Build resources array
      const resources = docIds.map((docId) => ({
        resource_type: "DOCUMENT" as const,
        resource_id_value: docId,
        ...(linkToProfile && {
          link_to_profile: {
            entity_type: entityType,
            entity_id: entityId,
          },
        }),
      }));

      const response = await fetch("/api/qcto/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institutionId,
          request_type: "DOCUMENT_REQUEST",
          title,
          description: description.trim() || undefined,
          resources,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create request");
      }

      toast.success("Document request created successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      setDocumentIds("");
      setLinkToProfile(false);
      setEntityId("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating document request:", error);
      toast.error(error.message || "Failed to create document request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Request Documents
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Documents</DialogTitle>
          <DialogDescription>
            Request access to documents from {institutionName}. Documents can be automatically linked to profiles when approved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Request facilitator qualifications"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what documents you need and why..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentIds">Document IDs *</Label>
            <Textarea
              id="documentIds"
              value={documentIds}
              onChange={(e) => setDocumentIds(e.target.value)}
              placeholder="Enter document IDs (one per line or comma-separated)"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the document IDs you want to request access to. You can find these in the document listings.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="linkToProfile"
              checked={linkToProfile}
              onCheckedChange={(checked) => setLinkToProfile(checked === true)}
              label=""
            />
            <Label htmlFor="linkToProfile" className="flex items-center gap-2 cursor-pointer">
              <LinkIcon className="h-4 w-4" />
              Link documents to profile when approved
            </Label>
          </div>

          {linkToProfile && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              <div className="space-y-2">
                <Label htmlFor="entityType">Link To *</Label>
                <Select
                  id="entityType"
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value as EntityType);
                    setEntityId(""); // Reset entity ID when type changes
                  }}
                >
                  {ENTITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityId">
                  {entityType === "FACILITATOR" && "Facilitator ID *"}
                  {entityType === "LEARNER" && "Learner ID *"}
                  {entityType === "READINESS" && "Readiness Record ID *"}
                  {entityType === "INSTITUTION" && "Institution ID *"}
                </Label>
                <Input
                  id="entityId"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  placeholder={`Enter ${entityType.toLowerCase()} ID`}
                  required={linkToProfile}
                />
                <p className="text-xs text-muted-foreground">
                  When the institution approves this request, the documents will be automatically linked to this {entityType.toLowerCase()}.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
