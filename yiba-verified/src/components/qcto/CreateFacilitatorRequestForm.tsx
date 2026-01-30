"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, Loader2, Search } from "lucide-react";

interface CreateFacilitatorRequestFormProps {
  institutionId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateFacilitatorRequestForm({
  institutionId,
  onSuccess,
  trigger,
}: CreateFacilitatorRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<"ALL" | "SPECIFIC" | "BY_QUALIFICATION" | "BY_CERTIFICATION">("ALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [facilitatorIds, setFacilitatorIds] = useState("");
  const [qualificationArea, setQualificationArea] = useState("");
  const [certificationType, setCertificationType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFacilitators, setSelectedFacilitators] = useState<string[]>([]);

  useEffect(() => {
    if (requestType === "SPECIFIC" && searchQuery.trim().length >= 2) {
      // Search for facilitators
      const searchFacilitators = async () => {
        try {
          const params = new URLSearchParams({
            search: searchQuery,
            institution_id: institutionId,
            limit: "20",
          });
          const res = await fetch(`/api/qcto/facilitators?${params}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.items || []);
          }
        } catch (error) {
          console.error("Error searching facilitators:", error);
        }
      };
      searchFacilitators();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, requestType, institutionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);

    try {
      let resources: Array<{
        resource_type: "FACILITATOR";
        resource_id_value: string;
        notes?: string;
      }> = [];

      if (requestType === "ALL") {
        // Request all facilitators for institution
        // Use special value "*" or "ALL" to indicate all facilitators
        resources = [{
          resource_type: "FACILITATOR",
          resource_id_value: "*", // Special value for "all facilitators"
          notes: "Request all facilitators for this institution",
        }];
      } else if (requestType === "SPECIFIC") {
        if (selectedFacilitators.length === 0) {
          toast.error("Please select at least one facilitator");
          setLoading(false);
          return;
        }
        resources = selectedFacilitators.map((id) => ({
          resource_type: "FACILITATOR" as const,
          resource_id_value: id,
          notes: `Request facilitator data`,
        }));
      } else if (requestType === "BY_QUALIFICATION") {
        if (!qualificationArea.trim()) {
          toast.error("Please specify qualification area");
          setLoading(false);
          return;
        }
        // For now, we'll request all and note the qualification filter
        // The institution can filter when responding
        resources = [{
          resource_type: "FACILITATOR",
          resource_id_value: "*",
          notes: `Request facilitators for qualification area: ${qualificationArea}`,
        }];
      } else if (requestType === "BY_CERTIFICATION") {
        if (!certificationType.trim()) {
          toast.error("Please specify certification type");
          setLoading(false);
          return;
        }
        resources = [{
          resource_type: "FACILITATOR",
          resource_id_value: "*",
          notes: `Request facilitators with certification type: ${certificationType}`,
        }];
      }

      const response = await fetch("/api/qcto/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_id: institutionId,
          request_type: "FACILITATOR_DATA",
          title: title.trim(),
          description: description.trim() || undefined,
          resources,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create facilitator request");
      }

      toast.success("Facilitator data request created successfully");
      setOpen(false);
      setTitle("");
      setDescription("");
      setRequestType("ALL");
      setFacilitatorIds("");
      setQualificationArea("");
      setCertificationType("");
      setSelectedFacilitators([]);
      setSearchQuery("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating facilitator request:", error);
      toast.error(error.message || "Failed to create facilitator request");
    } finally {
      setLoading(false);
    }
  };

  const toggleFacilitator = (facilitatorId: string) => {
    setSelectedFacilitators((prev) =>
      prev.includes(facilitatorId)
        ? prev.filter((id) => id !== facilitatorId)
        : [...prev, facilitatorId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Request Facilitator Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Facilitator Data</DialogTitle>
          <DialogDescription>
            Request facilitator information, qualifications, and certifications from this institution.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Request Facilitator Qualifications"
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
              onChange={(e) => {
                setRequestType(e.target.value as any);
                setSelectedFacilitators([]);
                setSearchQuery("");
              }}
              required
            >
              <option value="ALL">All Facilitators</option>
              <option value="SPECIFIC">Specific Facilitators</option>
              <option value="BY_QUALIFICATION">By Qualification Area</option>
              <option value="BY_CERTIFICATION">By Certification Type</option>
            </Select>
          </div>

          {requestType === "SPECIFIC" && (
            <div className="space-y-2">
              <Label>Search and Select Facilitators</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search facilitators by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map((facilitator) => (
                    <div
                      key={facilitator.facilitator_id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        checked={selectedFacilitators.includes(facilitator.facilitator_id)}
                        onCheckedChange={() => toggleFacilitator(facilitator.facilitator_id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {facilitator.first_name} {facilitator.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {facilitator.readiness?.qualification_title || "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedFacilitators.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedFacilitators.length} facilitator{selectedFacilitators.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {requestType === "BY_QUALIFICATION" && (
            <div className="space-y-2">
              <Label htmlFor="qualification_area">Qualification Area *</Label>
              <Input
                id="qualification_area"
                value={qualificationArea}
                onChange={(e) => setQualificationArea(e.target.value)}
                placeholder="e.g., Electrical Engineering, Business Management"
                required
              />
            </div>
          )}

          {requestType === "BY_CERTIFICATION" && (
            <div className="space-y-2">
              <Label htmlFor="certification_type">Certification Type *</Label>
              <Select
                id="certification_type"
                value={certificationType}
                onChange={(e) => setCertificationType(e.target.value)}
                required
              >
                <option value="">Select certification type...</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="INDUSTRY">Industry</option>
                <option value="SAQA">SAQA</option>
                <option value="WORK_PERMIT">Work Permit</option>
                <option value="VISA">Visa</option>
                <option value="OTHER">Other</option>
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
