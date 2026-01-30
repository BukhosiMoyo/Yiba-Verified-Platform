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
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";

interface CreateAssessmentRequestFormProps {
  institutionId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateAssessmentRequestForm({
  institutionId,
  onSuccess,
  trigger,
}: CreateAssessmentRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<"ALL" | "BY_QUALIFICATION" | "BY_TYPE" | "BY_DATE_RANGE">("ALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [qualificationId, setQualificationId] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);

    try {
      let resources: Array<{
        resource_type: "ENROLMENT";
        resource_id_value: string;
        notes?: string;
      }> = [];

      let notes = "";

      if (requestType === "ALL") {
        notes = "Request all assessment results and grades";
      } else if (requestType === "BY_QUALIFICATION") {
        if (!qualificationId.trim()) {
          toast.error("Please specify qualification");
          setLoading(false);
          return;
        }
        notes = `Request assessment results for qualification: ${qualificationId}`;
      } else if (requestType === "BY_TYPE") {
        if (!assessmentType.trim()) {
          toast.error("Please specify assessment type");
          setLoading(false);
          return;
        }
        notes = `Request ${assessmentType} assessment results`;
      } else if (requestType === "BY_DATE_RANGE") {
        if (!startDate || !endDate) {
          toast.error("Please specify date range");
          setLoading(false);
          return;
        }
        notes = `Request assessment results from ${startDate} to ${endDate}`;
      }

      // Request enrolments (which contain assessments)
      resources = [{
        resource_type: "ENROLMENT",
        resource_id_value: "*", // All enrolments
        notes,
      }];

      const response = await fetch("/api/qcto/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institutionId,
          request_type: "ASSESSMENT_DATA",
          title: title.trim(),
          description: description.trim() || undefined,
          resources,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create assessment request");
      }

      toast.success("Assessment data request created successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      setRequestType("ALL");
      setQualificationId("");
      setAssessmentType("");
      setStartDate("");
      setEndDate("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating assessment request:", error);
      toast.error(error.message || "Failed to create assessment request");
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
            Request Assessment Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Assessment Data</DialogTitle>
          <DialogDescription>
            Request assessment results, grades, and marks for learners.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Request Assessment Results"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what data you need..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_type">Request Type *</Label>
            <Select
              id="request_type"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as any)}
              required
            >
              <option value="ALL">All Assessments</option>
              <option value="BY_QUALIFICATION">By Qualification</option>
              <option value="BY_TYPE">By Assessment Type</option>
              <option value="BY_DATE_RANGE">By Date Range</option>
            </Select>
          </div>

          {requestType === "BY_QUALIFICATION" && (
            <div className="space-y-2">
              <Label htmlFor="qualification_id">Qualification ID or Name *</Label>
              <Input
                id="qualification_id"
                value={qualificationId}
                onChange={(e) => setQualificationId(e.target.value)}
                placeholder="e.g., SAQA ID or qualification name"
                required
              />
            </div>
          )}

          {requestType === "BY_TYPE" && (
            <div className="space-y-2">
              <Label htmlFor="assessment_type">Assessment Type *</Label>
              <Select
                id="assessment_type"
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                required
              >
                <option value="">Select type...</option>
                <option value="KNOWLEDGE">Knowledge</option>
                <option value="PRACTICAL">Practical</option>
                <option value="PORTFOLIO">Portfolio</option>
                <option value="FINAL_EXAM">Final Exam</option>
              </Select>
            </div>
          )}

          {requestType === "BY_DATE_RANGE" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
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
