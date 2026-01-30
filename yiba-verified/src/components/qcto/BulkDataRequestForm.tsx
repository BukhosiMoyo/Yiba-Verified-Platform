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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Database, Loader2, Users, GraduationCap, FileText, ClipboardList } from "lucide-react";

interface BulkDataRequestFormProps {
  institutionId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function BulkDataRequestForm({
  institutionId,
  onSuccess,
  trigger,
}: BulkDataRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [includeFacilitators, setIncludeFacilitators] = useState(true);
  const [includeLearners, setIncludeLearners] = useState(true);
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [includeReadiness, setIncludeReadiness] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!includeFacilitators && !includeLearners && !includeAssessments && !includeDocuments && !includeReadiness) {
      toast.error("Please select at least one data type");
      return;
    }

    setLoading(true);

    try {
      const resources: Array<{
        resource_type: "FACILITATOR" | "LEARNER" | "ENROLMENT" | "DOCUMENT" | "READINESS";
        resource_id_value: string;
        notes?: string;
      }> = [];

      if (includeFacilitators) {
        resources.push({
          resource_type: "FACILITATOR",
          resource_id_value: "*",
          notes: "Request all facilitator data",
        });
      }

      if (includeLearners) {
        resources.push({
          resource_type: "LEARNER",
          resource_id_value: "*",
          notes: "Request all learner data",
        });
      }

      if (includeAssessments) {
        resources.push({
          resource_type: "ENROLMENT",
          resource_id_value: "*",
          notes: "Request all assessment results and grades",
        });
      }

      if (includeDocuments) {
        resources.push({
          resource_type: "DOCUMENT",
          resource_id_value: "*",
          notes: "Request all documents",
        });
      }

      if (includeReadiness) {
        resources.push({
          resource_type: "READINESS",
          resource_id_value: "*",
          notes: "Request all readiness records",
        });
      }

      const response = await fetch("/api/qcto/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institutionId,
          request_type: "BULK_DATA",
          title: title.trim(),
          description: description.trim() || undefined,
          resources,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create bulk data request");
      }

      toast.success("Bulk data request created successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      setIncludeFacilitators(true);
      setIncludeLearners(true);
      setIncludeAssessments(true);
      setIncludeDocuments(false);
      setIncludeReadiness(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating bulk data request:", error);
      toast.error(error.message || "Failed to create bulk data request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Request All Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request All Data</DialogTitle>
          <DialogDescription>
            Create a comprehensive data request for multiple data types from this institution.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Comprehensive Data Request"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the data request..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Select Data Types to Request</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={includeFacilitators}
                  onCheckedChange={(checked) => setIncludeFacilitators(checked === true)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Facilitators</p>
                    <p className="text-xs text-muted-foreground">Qualifications, certifications, experience</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={includeLearners}
                  onCheckedChange={(checked) => setIncludeLearners(checked === true)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Learners</p>
                    <p className="text-xs text-muted-foreground">Academic history, personal information</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={includeAssessments}
                  onCheckedChange={(checked) => setIncludeAssessments(checked === true)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Assessments & Grades</p>
                    <p className="text-xs text-muted-foreground">Assessment results, marks, module completion</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={includeDocuments}
                  onCheckedChange={(checked) => setIncludeDocuments(checked === true)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <ClipboardList className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Documents</p>
                    <p className="text-xs text-muted-foreground">CVs, qualifications, contracts, certificates</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={includeReadiness}
                  onCheckedChange={(checked) => setIncludeReadiness(checked === true)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <ClipboardList className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Readiness Records</p>
                    <p className="text-xs text-muted-foreground">Form 5 readiness assessments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
