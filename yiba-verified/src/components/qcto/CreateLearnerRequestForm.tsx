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
import { GraduationCap, Loader2 } from "lucide-react";

interface CreateLearnerRequestFormProps {
  institutionId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateLearnerRequestForm({
  institutionId,
  onSuccess,
  trigger,
}: CreateLearnerRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<"ALL" | "BY_QUALIFICATION" | "BY_STATUS">("ALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [qualificationId, setQualificationId] = useState("");
  const [enrolmentStatus, setEnrolmentStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);

    try {
      let resources: Array<{
        resource_type: "LEARNER";
        resource_id_value: string;
        notes?: string;
      }> = [];

      if (requestType === "ALL") {
        resources = [{
          resource_type: "LEARNER",
          resource_id_value: "*", // All learners
          notes: "Request all learner data for this institution",
        }];
      } else if (requestType === "BY_QUALIFICATION") {
        if (!qualificationId.trim()) {
          toast.error("Please specify qualification");
          setLoading(false);
          return;
        }
        resources = [{
          resource_type: "LEARNER",
          resource_id_value: "*",
          notes: `Request learners enrolled in qualification: ${qualificationId}`,
        }];
      } else if (requestType === "BY_STATUS") {
        if (!enrolmentStatus.trim()) {
          toast.error("Please specify enrolment status");
          setLoading(false);
          return;
        }
        resources = [{
          resource_type: "LEARNER",
          resource_id_value: "*",
          notes: `Request learners with enrolment status: ${enrolmentStatus}`,
        }];
      }

      const response = await fetch("/api/qcto/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institutionId,
          request_type: "LEARNER_DATA",
          title: title.trim(),
          description: description.trim() || undefined,
          resources,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create learner request");
      }

      toast.success("Learner data request created successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      setRequestType("ALL");
      setQualificationId("");
      setEnrolmentStatus("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating learner request:", error);
      toast.error(error.message || "Failed to create learner request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <GraduationCap className="h-4 w-4 mr-2" />
            Request Learner Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Learner Data</DialogTitle>
          <DialogDescription>
            Request learner information, academic history, grades, and assessment results.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Request Learner Academic Records"
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
              <option value="ALL">All Learners</option>
              <option value="BY_QUALIFICATION">By Qualification</option>
              <option value="BY_STATUS">By Enrolment Status</option>
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

          {requestType === "BY_STATUS" && (
            <div className="space-y-2">
              <Label htmlFor="enrolment_status">Enrolment Status *</Label>
              <Select
                id="enrolment_status"
                value={enrolmentStatus}
                onChange={(e) => setEnrolmentStatus(e.target.value)}
                required
              >
                <option value="">Select status...</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="WITHDRAWN">Withdrawn</option>
                <option value="SUSPENDED">Suspended</option>
              </Select>
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
