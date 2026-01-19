"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import type { Readiness, DeliveryMode, ReadinessStatus } from "@prisma/client";

interface ReadinessEditFormProps {
  readiness: Readiness;
}

/**
 * ReadinessEditForm Component
 * 
 * Client component for editing readiness record details.
 * Handles form submission to PATCH /api/institutions/readiness/[readinessId]
 */
export function ReadinessEditForm({ readiness }: ReadinessEditFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    qualification_title: readiness.qualification_title || "",
    saqa_id: readiness.saqa_id || "",
    nqf_level: readiness.nqf_level?.toString() || "",
    curriculum_code: readiness.curriculum_code || "",
    delivery_mode: readiness.delivery_mode || "FACE_TO_FACE" as DeliveryMode,
    readiness_status: readiness.readiness_status || "NOT_STARTED" as ReadinessStatus,
    // Section 2: Self-Assessment
    self_assessment_completed: (readiness as any).self_assessment_completed ?? null,
    self_assessment_remarks: (readiness as any).self_assessment_remarks || "",
    // Section 3: Registration & Legal Compliance
    registration_type: (readiness as any).registration_type || "",
    professional_body_registration: (readiness as any).professional_body_registration ?? null,
    // Section 4: Infrastructure & Physical Resources
    training_site_address: (readiness as any).training_site_address || "",
    ownership_type: (readiness as any).ownership_type || "",
    number_of_training_rooms: (readiness as any).number_of_training_rooms?.toString() || "",
    room_capacity: (readiness as any).room_capacity?.toString() || "",
    facilitator_learner_ratio: (readiness as any).facilitator_learner_ratio || "",
    // Section 5: Learning Material Alignment
    learning_material_exists: (readiness as any).learning_material_exists ?? null,
    knowledge_module_coverage: (readiness as any).knowledge_module_coverage?.toString() || "",
    practical_module_coverage: (readiness as any).practical_module_coverage?.toString() || "",
    curriculum_alignment_confirmed: (readiness as any).curriculum_alignment_confirmed ?? null,
    // Section 6: Occupational Health & Safety (OHS)
    fire_extinguisher_available: (readiness as any).fire_extinguisher_available ?? null,
    fire_extinguisher_service_date: (readiness as any).fire_extinguisher_service_date 
      ? new Date((readiness as any).fire_extinguisher_service_date).toISOString().split('T')[0] 
      : "",
    emergency_exits_marked: (readiness as any).emergency_exits_marked ?? null,
    accessibility_for_disabilities: (readiness as any).accessibility_for_disabilities ?? null,
    first_aid_kit_available: (readiness as any).first_aid_kit_available ?? null,
    ohs_representative_name: (readiness as any).ohs_representative_name || "",
    // Section 7: LMS & Online Delivery Capability
    lms_name: (readiness as any).lms_name || "",
    max_learner_capacity: (readiness as any).max_learner_capacity?.toString() || "",
    internet_connectivity_method: (readiness as any).internet_connectivity_method || "",
    isp: (readiness as any).isp || "",
    backup_frequency: (readiness as any).backup_frequency || "",
    data_storage_description: (readiness as any).data_storage_description || "",
    security_measures_description: (readiness as any).security_measures_description || "",
    // Section 8: Workplace-Based Learning (WBL)
    wbl_workplace_partner_name: (readiness as any).wbl_workplace_partner_name || "",
    wbl_agreement_type: (readiness as any).wbl_agreement_type || "",
    wbl_agreement_duration: (readiness as any).wbl_agreement_duration || "",
    wbl_components_covered: (readiness as any).wbl_components_covered || "",
    wbl_learner_support_description: (readiness as any).wbl_learner_support_description || "",
    wbl_assessment_responsibility: (readiness as any).wbl_assessment_responsibility || "",
    // Section 9: Policies & Procedures
    policies_procedures_notes: (readiness as any).policies_procedures_notes || "",
    // Section 10: Human Resources (Facilitators)
    facilitators_notes: (readiness as any).facilitators_notes || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: any = {
        qualification_title: formData.qualification_title.trim() || undefined,
        saqa_id: formData.saqa_id.trim() || undefined,
        curriculum_code: formData.curriculum_code.trim() || undefined,
        delivery_mode: formData.delivery_mode || undefined,
        // Section 2: Self-Assessment
        self_assessment_completed: formData.self_assessment_completed !== null ? formData.self_assessment_completed : undefined,
        self_assessment_remarks: formData.self_assessment_remarks.trim() || null,
        // Section 3: Registration & Legal Compliance
        registration_type: formData.registration_type.trim() || null,
        professional_body_registration: formData.professional_body_registration !== null ? formData.professional_body_registration : undefined,
        // Section 4: Infrastructure & Physical Resources
        training_site_address: formData.training_site_address.trim() || null,
        ownership_type: formData.ownership_type.trim() || null,
        number_of_training_rooms: formData.number_of_training_rooms ? parseInt(formData.number_of_training_rooms, 10) : null,
        room_capacity: formData.room_capacity ? parseInt(formData.room_capacity, 10) : null,
        facilitator_learner_ratio: formData.facilitator_learner_ratio.trim() || null,
        // Section 5: Learning Material Alignment
        learning_material_exists: formData.learning_material_exists !== null ? formData.learning_material_exists : undefined,
        knowledge_module_coverage: formData.knowledge_module_coverage ? Math.min(100, Math.max(0, parseInt(formData.knowledge_module_coverage, 10))) : null,
        practical_module_coverage: formData.practical_module_coverage ? Math.min(100, Math.max(0, parseInt(formData.practical_module_coverage, 10))) : null,
        curriculum_alignment_confirmed: formData.curriculum_alignment_confirmed !== null ? formData.curriculum_alignment_confirmed : undefined,
        // Section 6: Occupational Health & Safety (OHS)
        fire_extinguisher_available: formData.fire_extinguisher_available !== null ? formData.fire_extinguisher_available : undefined,
        fire_extinguisher_service_date: formData.fire_extinguisher_service_date || null,
        emergency_exits_marked: formData.emergency_exits_marked !== null ? formData.emergency_exits_marked : undefined,
        accessibility_for_disabilities: formData.accessibility_for_disabilities !== null ? formData.accessibility_for_disabilities : undefined,
        first_aid_kit_available: formData.first_aid_kit_available !== null ? formData.first_aid_kit_available : undefined,
        ohs_representative_name: formData.ohs_representative_name.trim() || null,
        // Section 7: LMS & Online Delivery Capability
        lms_name: formData.lms_name.trim() || null,
        max_learner_capacity: formData.max_learner_capacity ? parseInt(formData.max_learner_capacity, 10) : null,
        internet_connectivity_method: formData.internet_connectivity_method.trim() || null,
        isp: formData.isp.trim() || null,
        backup_frequency: formData.backup_frequency.trim() || null,
        data_storage_description: formData.data_storage_description.trim() || null,
        security_measures_description: formData.security_measures_description.trim() || null,
        // Section 8: Workplace-Based Learning (WBL)
        wbl_workplace_partner_name: formData.wbl_workplace_partner_name.trim() || null,
        wbl_agreement_type: formData.wbl_agreement_type.trim() || null,
        wbl_agreement_duration: formData.wbl_agreement_duration.trim() || null,
        wbl_components_covered: formData.wbl_components_covered.trim() || null,
        wbl_learner_support_description: formData.wbl_learner_support_description.trim() || null,
        wbl_assessment_responsibility: formData.wbl_assessment_responsibility.trim() || null,
        // Section 9: Policies & Procedures
        policies_procedures_notes: formData.policies_procedures_notes.trim() || null,
        // Section 10: Human Resources (Facilitators)
        facilitators_notes: formData.facilitators_notes.trim() || null,
      };

      if (formData.nqf_level) {
        const nqfLevel = parseInt(formData.nqf_level, 10);
        if (!isNaN(nqfLevel)) {
          updateData.nqf_level = nqfLevel;
        }
      }

      // Only include status if it's changing to SUBMITTED
      if (formData.readiness_status === "SUBMITTED" && readiness.readiness_status !== "SUBMITTED") {
        updateData.readiness_status = "SUBMITTED";
      }

      const response = await fetch(`/api/institutions/readiness/${readiness.readiness_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update readiness record");
      }

      // Show success toast
      if (formData.readiness_status === "SUBMITTED" && readiness.readiness_status !== "SUBMITTED") {
        toast.success("Readiness record submitted for QCTO review!");
      } else {
        toast.success("Readiness record updated successfully!");
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred while updating the readiness record";
      setError(errorMessage);
      toast.error(`Failed to update: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = readiness.readiness_status === "NOT_STARTED" || readiness.readiness_status === "IN_PROGRESS";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Readiness Record</CardTitle>
        <CardDescription>
          Update qualification information and readiness status
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
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="saqa_id">SAQA ID *</Label>
                <HelpTooltip content="The South African Qualifications Authority (SAQA) ID is a unique identifier for the qualification registered on the NQF." />
              </div>
              <Input
                id="saqa_id"
                type="text"
                value={formData.saqa_id}
                onChange={(e) => setFormData({ ...formData, saqa_id: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="nqf_level">NQF Level</Label>
                <HelpTooltip content="The National Qualifications Framework (NQF) level indicates the complexity and depth of the qualification. Levels range from 1 (entry level) to 10 (doctorate level)." />
              </div>
              <Input
                id="nqf_level"
                type="number"
                min="1"
                max="10"
                value={formData.nqf_level}
                onChange={(e) => setFormData({ ...formData, nqf_level: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curriculum_code">Curriculum Code *</Label>
              <Input
                id="curriculum_code"
                type="text"
                value={formData.curriculum_code}
                onChange={(e) => setFormData({ ...formData, curriculum_code: e.target.value })}
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

          {/* Section 2: Self-Assessment */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Self-Assessment</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="self_assessment_completed">Self-Assessment Completed *</Label>
                <select
                  id="self_assessment_completed"
                  value={formData.self_assessment_completed === null ? "" : formData.self_assessment_completed ? "true" : "false"}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    self_assessment_completed: e.target.value === "" ? null : e.target.value === "true" 
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="self_assessment_remarks">Remarks / Narrative</Label>
                <textarea
                  id="self_assessment_remarks"
                  value={formData.self_assessment_remarks}
                  onChange={(e) => setFormData({ ...formData, self_assessment_remarks: e.target.value })}
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter self-assessment remarks or narrative..."
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Provide additional context or details about the self-assessment.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>💡 <strong>Note:</strong> Supporting evidence documents can be uploaded separately via the Documents section.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Registration & Legal Compliance */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Registration & Legal Compliance</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration_type">Registration Type</Label>
                <Input
                  id="registration_type"
                  type="text"
                  value={formData.registration_type}
                  onChange={(e) => setFormData({ ...formData, registration_type: e.target.value })}
                  placeholder="e.g., Company Registration, Non-Profit Registration, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Type of business registration (e.g., Section 21, Pty Ltd, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professional_body_registration">Professional Body Registration</Label>
                <select
                  id="professional_body_registration"
                  value={formData.professional_body_registration === null ? "" : formData.professional_body_registration ? "true" : "false"}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    professional_body_registration: e.target.value === "" ? null : e.target.value === "true" 
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p>📄 <strong>Required Documents:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Registration Proof (Company/Entity Registration Certificate)</li>
                  <li>Tax Compliance PIN / Exemption Proof</li>
                  <li>Professional Body Registration Certificate (if applicable)</li>
                </ul>
                <p className="mt-2">
                  These documents should be uploaded via the Documents section above. The system supports document versioning - you can replace documents if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Infrastructure & Physical Resources */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Infrastructure & Physical Resources</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="training_site_address">Training Site Address *</Label>
                <textarea
                  id="training_site_address"
                  value={formData.training_site_address}
                  onChange={(e) => setFormData({ ...formData, training_site_address: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter full physical address of the training site..."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ownership_type">Ownership Type</Label>
                  <select
                    id="ownership_type"
                    value={formData.ownership_type}
                    onChange={(e) => setFormData({ ...formData, ownership_type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select...</option>
                    <option value="OWNED">Owned</option>
                    <option value="LEASED">Leased</option>
                    <option value="RENTED">Rented</option>
                    <option value="PARTNERSHIP">Partnership Agreement</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number_of_training_rooms">Number of Training Rooms</Label>
                  <Input
                    id="number_of_training_rooms"
                    type="number"
                    min="0"
                    value={formData.number_of_training_rooms}
                    onChange={(e) => setFormData({ ...formData, number_of_training_rooms: e.target.value })}
                    placeholder="e.g., 5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room_capacity">Room Capacity (per room)</Label>
                  <Input
                    id="room_capacity"
                    type="number"
                    min="1"
                    value={formData.room_capacity}
                    onChange={(e) => setFormData({ ...formData, room_capacity: e.target.value })}
                    placeholder="e.g., 20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilitator_learner_ratio">Facilitator : Learner Ratio</Label>
                  <Input
                    id="facilitator_learner_ratio"
                    type="text"
                    value={formData.facilitator_learner_ratio}
                    onChange={(e) => setFormData({ ...formData, facilitator_learner_ratio: e.target.value })}
                    placeholder="e.g., 1:15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: e.g., "1:15" or "1 facilitator per 15 learners"
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p>📄 <strong>Required Documents:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Proof of Ownership / Lease Agreement</li>
                  <li>Furniture & Equipment Checklist</li>
                  <li>Inventory Upload</li>
                </ul>
                <p className="mt-2">
                  Upload these documents via the Documents section above.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Learning Material Alignment */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Learning Material Alignment</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="learning_material_exists">Learning Material Exists *</Label>
                <select
                  id="learning_material_exists"
                  value={formData.learning_material_exists === null ? "" : formData.learning_material_exists ? "true" : "false"}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    learning_material_exists: e.target.value === "" ? null : e.target.value === "true" 
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {formData.learning_material_exists === true && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="knowledge_module_coverage">Knowledge Module Coverage (%)</Label>
                    <Input
                      id="knowledge_module_coverage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.knowledge_module_coverage}
                      onChange={(e) => setFormData({ ...formData, knowledge_module_coverage: e.target.value })}
                      placeholder="e.g., 75"
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of knowledge modules covered by learning materials (0-100%)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practical_module_coverage">Practical Module Coverage (%)</Label>
                    <Input
                      id="practical_module_coverage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.practical_module_coverage}
                      onChange={(e) => setFormData({ ...formData, practical_module_coverage: e.target.value })}
                      placeholder="e.g., 80"
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of practical modules covered by learning materials (0-100%)
                    </p>
                  </div>
                </div>
              )}

              {formData.learning_material_exists === true && (
                <div className="space-y-2">
                  <Label htmlFor="curriculum_alignment_confirmed">Curriculum Alignment Confirmed</Label>
                  <select
                    id="curriculum_alignment_confirmed"
                    value={formData.curriculum_alignment_confirmed === null ? "" : formData.curriculum_alignment_confirmed ? "true" : "false"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      curriculum_alignment_confirmed: e.target.value === "" ? null : e.target.value === "true" 
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes ✓</option>
                    <option value="false">No ✗</option>
                  </select>
                </div>
              )}

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p>📄 <strong>Required Documents:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Sample Learning Material Upload (≥50% coverage required)</li>
                </ul>
                <p className="mt-2">
                  Upload sample learning materials via the Documents section above. At least 50% coverage is required.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Occupational Health & Safety (OHS) */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Occupational Health & Safety (OHS)</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fire_extinguisher_available">Fire Extinguisher Available</Label>
                  <select
                    id="fire_extinguisher_available"
                    value={formData.fire_extinguisher_available === null ? "" : formData.fire_extinguisher_available ? "true" : "false"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      fire_extinguisher_available: e.target.value === "" ? null : e.target.value === "true" 
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                {formData.fire_extinguisher_available === true && (
                  <div className="space-y-2">
                    <Label htmlFor="fire_extinguisher_service_date">Fire Extinguisher Service Date</Label>
                    <Input
                      id="fire_extinguisher_service_date"
                      type="date"
                      value={formData.fire_extinguisher_service_date}
                      onChange={(e) => setFormData({ ...formData, fire_extinguisher_service_date: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="emergency_exits_marked">Emergency Exits Marked</Label>
                  <select
                    id="emergency_exits_marked"
                    value={formData.emergency_exits_marked === null ? "" : formData.emergency_exits_marked ? "true" : "false"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      emergency_exits_marked: e.target.value === "" ? null : e.target.value === "true" 
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessibility_for_disabilities">Accessibility for Disabilities</Label>
                  <select
                    id="accessibility_for_disabilities"
                    value={formData.accessibility_for_disabilities === null ? "" : formData.accessibility_for_disabilities ? "true" : "false"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      accessibility_for_disabilities: e.target.value === "" ? null : e.target.value === "true" 
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_aid_kit_available">First Aid Kit Available</Label>
                  <select
                    id="first_aid_kit_available"
                    value={formData.first_aid_kit_available === null ? "" : formData.first_aid_kit_available ? "true" : "false"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      first_aid_kit_available: e.target.value === "" ? null : e.target.value === "true" 
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ohs_representative_name">OHS Representative Name</Label>
                  <Input
                    id="ohs_representative_name"
                    type="text"
                    value={formData.ohs_representative_name}
                    onChange={(e) => setFormData({ ...formData, ohs_representative_name: e.target.value })}
                    placeholder="e.g., John Smith"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p>📄 <strong>Required Documents:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Evacuation Plan Upload</li>
                  <li>OHS Audit Report Upload</li>
                  <li>OHS Appointment Letter Upload</li>
                </ul>
                <p className="mt-2">
                  Upload these documents via the Documents section above.
                </p>
              </div>
            </div>
          </div>

          {/* Section 7: LMS & Online Delivery Capability */}
          {(formData.delivery_mode === "BLENDED" || formData.delivery_mode === "MOBILE" || (readiness as any).lms_name) && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">LMS & Online Delivery Capability</h3>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                  <p>ℹ️ <strong>Note:</strong> This section is required for Blended or Mobile delivery modes.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lms_name">LMS Name</Label>
                    <Input
                      id="lms_name"
                      type="text"
                      value={formData.lms_name}
                      onChange={(e) => setFormData({ ...formData, lms_name: e.target.value })}
                      placeholder="e.g., Moodle, Canvas, Custom LMS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_learner_capacity">Max Learner Capacity</Label>
                    <Input
                      id="max_learner_capacity"
                      type="number"
                      min="1"
                      value={formData.max_learner_capacity}
                      onChange={(e) => setFormData({ ...formData, max_learner_capacity: e.target.value })}
                      placeholder="e.g., 1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="internet_connectivity_method">Internet Connectivity Method</Label>
                    <Input
                      id="internet_connectivity_method"
                      type="text"
                      value={formData.internet_connectivity_method}
                      onChange={(e) => setFormData({ ...formData, internet_connectivity_method: e.target.value })}
                      placeholder="e.g., Fiber, ADSL, Satellite"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isp">ISP (Internet Service Provider)</Label>
                    <Input
                      id="isp"
                      type="text"
                      value={formData.isp}
                      onChange={(e) => setFormData({ ...formData, isp: e.target.value })}
                      placeholder="e.g., Vodacom, MTN, Telkom"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backup_frequency">Backup Frequency</Label>
                    <Input
                      id="backup_frequency"
                      type="text"
                      value={formData.backup_frequency}
                      onChange={(e) => setFormData({ ...formData, backup_frequency: e.target.value })}
                      placeholder="e.g., Daily, Weekly, Real-time"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_storage_description">Data Storage Description</Label>
                  <textarea
                    id="data_storage_description"
                    value={formData.data_storage_description}
                    onChange={(e) => setFormData({ ...formData, data_storage_description: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe data storage location, method, and capacity..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="security_measures_description">Security Measures Description</Label>
                  <textarea
                    id="security_measures_description"
                    value={formData.security_measures_description}
                    onChange={(e) => setFormData({ ...formData, security_measures_description: e.target.value })}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe security measures in place (encryption, access controls, etc.)..."
                  />
                </div>

                <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                  <p>📄 <strong>Required Documents:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>LMS Licence Proof Upload</li>
                  </ul>
                  <p className="mt-2">
                    Upload LMS licence documentation via the Documents section above.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 8: Workplace-Based Learning (WBL) */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Workplace-Based Learning (WBL)</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wbl_workplace_partner_name">Workplace Partner Name</Label>
                  <Input
                    id="wbl_workplace_partner_name"
                    type="text"
                    value={formData.wbl_workplace_partner_name}
                    onChange={(e) => setFormData({ ...formData, wbl_workplace_partner_name: e.target.value })}
                    placeholder="e.g., ABC Company, XYZ Organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wbl_agreement_type">Agreement Type</Label>
                  <Input
                    id="wbl_agreement_type"
                    type="text"
                    value={formData.wbl_agreement_type}
                    onChange={(e) => setFormData({ ...formData, wbl_agreement_type: e.target.value })}
                    placeholder="e.g., MOU, Service Agreement, Partnership"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wbl_agreement_duration">Agreement Duration</Label>
                  <Input
                    id="wbl_agreement_duration"
                    type="text"
                    value={formData.wbl_agreement_duration}
                    onChange={(e) => setFormData({ ...formData, wbl_agreement_duration: e.target.value })}
                    placeholder="e.g., 12 months, 3 years, Ongoing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wbl_assessment_responsibility">Assessment Responsibility</Label>
                  <Input
                    id="wbl_assessment_responsibility"
                    type="text"
                    value={formData.wbl_assessment_responsibility}
                    onChange={(e) => setFormData({ ...formData, wbl_assessment_responsibility: e.target.value })}
                    placeholder="e.g., Institution, Workplace Partner, Shared"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wbl_components_covered">WBL Components Covered</Label>
                <textarea
                  id="wbl_components_covered"
                  value={formData.wbl_components_covered}
                  onChange={(e) => setFormData({ ...formData, wbl_components_covered: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the WBL components covered by this agreement..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wbl_learner_support_description">Learner Support Description</Label>
                <textarea
                  id="wbl_learner_support_description"
                  value={formData.wbl_learner_support_description}
                  onChange={(e) => setFormData({ ...formData, wbl_learner_support_description: e.target.value })}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the support provided to learners during workplace-based learning..."
                />
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p>📄 <strong>Required Documents:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>WBL Agreement Upload</li>
                  <li>Logbook Template Upload</li>
                  <li>Monitoring Schedule Upload</li>
                </ul>
                <p className="mt-2">
                  Upload these documents via the Documents section above.
                </p>
              </div>
            </div>
          </div>

          {/* Section 9: Policies & Procedures */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Policies & Procedures</h3>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                <p>ℹ️ <strong>Note:</strong> Full policy management (with policy list, effective dates, review dates) will be available in a future update.</p>
                <p className="mt-2">
                  For now, please upload policy documents via the Documents section and provide any additional notes below.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="policies_procedures_notes">Policies & Procedures Notes</Label>
                <textarea
                  id="policies_procedures_notes"
                  value={formData.policies_procedures_notes}
                  onChange={(e) => setFormData({ ...formData, policies_procedures_notes: e.target.value })}
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="List policies and their status, or provide any additional information about policies and procedures..."
                />
                <p className="text-xs text-muted-foreground">
                  Required policies: Finance, HR, Teaching & Learning, Assessment, Appeals, OHS, Refunds
                </p>
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p>📄 <strong>Required Policy Documents:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Finance Policy</li>
                  <li>HR Policy</li>
                  <li>Teaching & Learning Policy</li>
                  <li>Assessment Policy</li>
                  <li>Appeals Policy</li>
                  <li>OHS Policy</li>
                  <li>Refunds Policy</li>
                </ul>
                <p className="mt-2">
                  Upload all policy documents via the Documents section above. Each policy document should include effective date and review date if available.
                </p>
              </div>
            </div>
          </div>

          {/* Section 10: Human Resources (Facilitators) */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Human Resources (Facilitators)</h3>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                <p>ℹ️ <strong>Note:</strong> Full facilitator management (with facilitator table, CVs, qualifications, contracts) will be available in a future update.</p>
                <p className="mt-2">
                  For now, please upload facilitator CVs and contracts via the Documents section and provide facilitator information below.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilitators_notes">Facilitators Information</Label>
                <textarea
                  id="facilitators_notes"
                  value={formData.facilitators_notes}
                  onChange={(e) => setFormData({ ...formData, facilitators_notes: e.target.value })}
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="List facilitators, their roles (Facilitator/Assessor/Moderator), qualifications, and industry experience..."
                />
                <p className="text-xs text-muted-foreground">
                  At least one facilitator is required. Include: Full Name, ID/Passport, Role, Qualifications, Industry Experience
                </p>
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                <p>📄 <strong>Required Documents per Facilitator:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>CV Upload</li>
                  <li>Contract / SLA Upload</li>
                  <li>SAQA Evaluation (if applicable)</li>
                  <li>Work Permit (if applicable)</li>
                </ul>
                <p className="mt-2">
                  Upload facilitator documents via the Documents section above. Each facilitator should have their CV and contract uploaded.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-2">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-800 p-4 text-sm">
              <span className="font-medium">Success:</span> Readiness record updated successfully!
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>

            {canSubmit && (
              <Button
                type="button"
                variant="default"
                disabled={isSubmitting || readiness.readiness_status === "SUBMITTED"}
                onClick={async () => {
                  setIsSubmitting(true);
                  setError(null);
                  try {
                    const response = await fetch(`/api/institutions/readiness/${readiness.readiness_id}`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ readiness_status: "SUBMITTED" }),
                    });

                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || "Failed to submit readiness record");
                    }

                    setSuccess(true);
                    setTimeout(() => {
                      router.refresh();
                    }, 1000);
                  } catch (err: any) {
                    setError(err.message || "An error occurred while submitting the readiness record");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit for QCTO Review"}
              </Button>
            )}
          </div>

          {!canSubmit && (
            <p className="text-sm text-muted-foreground">
              This readiness record cannot be edited in its current status ({readiness.readiness_status.replace(/_/g, " ")}).
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
