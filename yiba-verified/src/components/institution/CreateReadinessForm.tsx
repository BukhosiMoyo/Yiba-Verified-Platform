"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeliveryMode } from "@prisma/client";

/**
 * CreateReadinessForm Component
 * 
 * Client component for creating a new readiness record.
 * Handles form submission to POST /api/institutions/readiness
 */
export function CreateReadinessForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    qualification_title: "",
    saqa_id: "",
    nqf_level: "",
    curriculum_code: "",
    delivery_mode: "FACE_TO_FACE" as DeliveryMode,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const createData: any = {
        qualification_title: formData.qualification_title.trim(),
        saqa_id: formData.saqa_id.trim(),
        curriculum_code: formData.curriculum_code.trim(),
        delivery_mode: formData.delivery_mode,
      };

      if (formData.nqf_level) {
        const nqfLevel = parseInt(formData.nqf_level, 10);
        if (!isNaN(nqfLevel)) {
          createData.nqf_level = nqfLevel;
        }
      }

      const response = await fetch("/api/institutions/readiness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create readiness record");
      }

      const readiness = await response.json();

      // Show success toast
      const { toast } = await import("sonner");
      toast.success("Readiness record created successfully!");

      // Redirect to the new readiness record detail page
      router.push(`/institution/readiness/${readiness.readiness_id}`);
      router.refresh();
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred while creating the readiness record";
      setError(errorMessage);
      const { toast } = await import("sonner");
      toast.error(`Failed to create: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Readiness Record</CardTitle>
        <CardDescription>
          Enter qualification information to start the Form 5 readiness process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qualification_title">Qualification Title *</Label>
              <Input
                id="qualification_title"
                type="text"
                value={formData.qualification_title}
                onChange={(e) => setFormData({ ...formData, qualification_title: e.target.value })}
                placeholder="e.g., Project Manager"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saqa_id">SAQA ID *</Label>
              <Input
                id="saqa_id"
                type="text"
                value={formData.saqa_id}
                onChange={(e) => setFormData({ ...formData, saqa_id: e.target.value })}
                placeholder="e.g., 66869"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nqf_level">NQF Level</Label>
              <Input
                id="nqf_level"
                type="number"
                min="1"
                max="10"
                value={formData.nqf_level}
                onChange={(e) => setFormData({ ...formData, nqf_level: e.target.value })}
                placeholder="e.g., 6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curriculum_code">Curriculum Code *</Label>
              <Input
                id="curriculum_code"
                type="text"
                value={formData.curriculum_code}
                onChange={(e) => setFormData({ ...formData, curriculum_code: e.target.value })}
                placeholder="e.g., 66869-00-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_mode">Delivery Mode *</Label>
              <select
                id="delivery_mode"
                value={formData.delivery_mode}
                onChange={(e) => setFormData({ ...formData, delivery_mode: e.target.value as DeliveryMode })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="FACE_TO_FACE">Face to Face</option>
                <option value="BLENDED">Blended</option>
                <option value="MOBILE">Mobile</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Create Readiness Record"}
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
