"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker/date-picker";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { FileText, Lightbulb, Info } from "lucide-react";
import type { DeliveryMode } from "@prisma/client";

import { cn } from "@/lib/utils";
import { SectionDocumentUpload } from "./SectionDocumentUpload";
import { QualificationPicker, type QualificationRegistryItem } from "./QualificationPicker";
import { FacilitatorManager } from "./FacilitatorManager";
import { getAllDocumentsForSection, sectionRequiresDocuments } from "@/lib/readinessDocumentTypes";

interface ReadinessFormStepContentProps {
  step: number;
  formData: Record<string, unknown>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  qualificationFieldsLocked?: boolean; // If true, qualification fields are immutable
  readinessId?: string;
  institutionId?: string;
  canEdit?: boolean;
}

const textareaClass = "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const selectClass = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const docsClass = "text-sm border border-blue-400/30 bg-blue-500/10 text-foreground p-4 rounded-lg";

export function ReadinessFormStepContent({ 
  step, 
  formData, 
  setFormData, 
  qualificationFieldsLocked = false,
  readinessId,
  institutionId,
  canEdit = true,
}: ReadinessFormStepContentProps) {
  const fd = formData as any;
  const set = setFormData as React.Dispatch<React.SetStateAction<any>>;
  
  // Get section name and document requirements
  const STEP_NAMES: Record<number, string> = {
    1: "Qualification Information",
    2: "Self-Assessment",
    3: "Registration & Legal Compliance",
    4: "Infrastructure & Physical Resources",
    5: "Learning Material Alignment",
    6: "Occupational Health & Safety",
    7: "LMS & Online Delivery Capability",
    8: "Workplace-Based Learning",
    9: "Policies & Procedures",
    10: "Human Resources (Facilitators)",
  };
  
  const sectionName = STEP_NAMES[step] || `Section ${step}`;
  const requiredDocumentTypes = getAllDocumentsForSection(step);
  const showDocumentUpload = sectionRequiresDocuments(step) && readinessId && institutionId;
  
  // Helper to render document upload section
  const renderDocumentUpload = () => {
    if (!showDocumentUpload) return null;
    return (
      <SectionDocumentUpload
        sectionName={sectionName}
        sectionNumber={step}
        requiredDocumentTypes={requiredDocumentTypes}
        readinessId={readinessId!}
        institutionId={institutionId!}
        qualificationTitle={fd.qualification_title}
        saqaId={fd.saqa_id}
        curriculumCode={fd.curriculum_code}
        onDocumentUploaded={() => {}}
        onDocumentRemoved={() => {}}
        canEdit={canEdit}
      />
    );
  };

  const selectedRegistryForPicker: QualificationRegistryItem | null = fd.qualification_registry_id && fd.qualification_title
    ? {
        id: fd.qualification_registry_id,
        name: fd.qualification_title,
        saqa_id: fd.saqa_id ?? null,
        curriculum_code: fd.curriculum_code ?? null,
        nqf_level: fd.nqf_level != null && fd.nqf_level !== "" ? parseInt(String(fd.nqf_level), 10) : null,
        credits: fd.credits != null && fd.credits !== "" ? parseInt(String(fd.credits), 10) : null,
        occupational_category: fd.occupational_category ?? null,
      }
    : null;

  const handlePickerSelect = (item: QualificationRegistryItem | null) => {
    if (item) {
      set((p: any) => ({
        ...p,
        qualification_registry_id: item.id,
        qualification_title: item.name,
        saqa_id: item.saqa_id ?? "",
        curriculum_code: item.curriculum_code ?? "",
        nqf_level: item.nqf_level != null ? String(item.nqf_level) : "",
        credits: item.credits != null ? String(item.credits) : "",
        occupational_category: item.occupational_category ?? "",
      }));
    } else {
      set((p: any) => ({ ...p, qualification_registry_id: null }));
    }
  };

  switch (step) {
    case 1:
      return (
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 p-3 mb-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Form 5 Section 2: Qualification Information</strong> - This information becomes immutable once submitted to QCTO.
            </p>
          </div>
          {!qualificationFieldsLocked && (
            <div className="space-y-2">
              <QualificationPicker
                apiPath="/api/institutions/qualifications"
                label="Search qualification (registry)"
                value={selectedRegistryForPicker}
                onSelect={handlePickerSelect}
                placeholder="Search by name, SAQA ID, or curriculum code…"
              />
              {fd.qualification_registry_id && (
                <p className="text-xs text-muted-foreground">Linked to registry. Fields below are auto-filled; you can edit if needed.</p>
              )}
              {!fd.qualification_registry_id && (fd.qualification_title || fd.saqa_id) && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Manual entry — unregistered qualification.</p>
              )}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qualification_title">Qualification Title *</Label>
              <Input 
                id="qualification_title" 
                type="text" 
                value={fd.qualification_title || ""} 
                onChange={(e) => set((p: any) => ({ ...p, qualification_title: e.target.value }))} 
                required 
                className="h-10 rounded-lg" 
                disabled={qualificationFieldsLocked}
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
                value={fd.saqa_id || ""} 
                onChange={(e) => set((p: any) => ({ ...p, saqa_id: e.target.value }))} 
                required 
                className="h-10 rounded-lg" 
                disabled={qualificationFieldsLocked}
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
                min={1} 
                max={10} 
                value={fd.nqf_level || ""} 
                onChange={(e) => set((p: any) => ({ ...p, nqf_level: e.target.value }))} 
                className="h-10 rounded-lg" 
                disabled={qualificationFieldsLocked}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="curriculum_code">Curriculum Code *</Label>
              <Input 
                id="curriculum_code" 
                type="text" 
                value={fd.curriculum_code || ""} 
                onChange={(e) => set((p: any) => ({ ...p, curriculum_code: e.target.value }))} 
                required 
                className="h-10 rounded-lg" 
                disabled={qualificationFieldsLocked}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits *</Label>
              <Input 
                id="credits" 
                type="number" 
                min={0} 
                value={fd.credits || ""} 
                onChange={(e) => set((p: any) => ({ ...p, credits: e.target.value }))} 
                required 
                className="h-10 rounded-lg" 
                disabled={qualificationFieldsLocked}
                placeholder="Number of credits"
              />
              <p className="text-xs text-muted-foreground">Required per Form 5 Section 2</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupational_category">Occupational Category</Label>
              <Input 
                id="occupational_category" 
                type="text" 
                value={fd.occupational_category || ""} 
                onChange={(e) => set((p: any) => ({ ...p, occupational_category: e.target.value }))} 
                className="h-10 rounded-lg" 
                disabled={qualificationFieldsLocked}
                placeholder="e.g., Engineering, Healthcare, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intended_learner_intake">Intended Learner Intake</Label>
              <Input 
                id="intended_learner_intake" 
                type="number" 
                min={1} 
                value={fd.intended_learner_intake || ""} 
                onChange={(e) => set((p: any) => ({ ...p, intended_learner_intake: e.target.value }))} 
                className="h-10 rounded-lg" 
                disabled={qualificationFieldsLocked}
                placeholder="Target number of learners"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_mode">Delivery Mode *</Label>
              <select 
                id="delivery_mode" 
                value={fd.delivery_mode || "FACE_TO_FACE"} 
                onChange={(e) => set((p: any) => ({ ...p, delivery_mode: e.target.value as DeliveryMode }))} 
                className={selectClass} 
                required
                disabled={qualificationFieldsLocked}
              >
                <option value="FACE_TO_FACE">Face to Face</option>
                <option value="BLENDED">Blended</option>
                <option value="MOBILE">Mobile</option>
              </select>
              {qualificationFieldsLocked && (
                <p className="text-xs text-amber-600">Delivery mode cannot be changed after submission</p>
              )}
            </div>
          </div>
          {qualificationFieldsLocked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 p-3">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <strong>Note:</strong> Qualification information is locked after submission. Contact QCTO if changes are needed.
              </p>
            </div>
          )}
        </div>
      );

    case 2:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Self-Assessment</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="self_assessment_completed">Self-Assessment Completed *</Label>
              <select id="self_assessment_completed" value={fd.self_assessment_completed == null ? "" : fd.self_assessment_completed ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, self_assessment_completed: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass} required>
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="self_assessment_remarks">Remarks / Narrative</Label>
              <textarea id="self_assessment_remarks" value={fd.self_assessment_remarks || ""} onChange={(e) => set((p: any) => ({ ...p, self_assessment_remarks: e.target.value }))} rows={5} className={cn(textareaClass, "resize-y min-h-[7.5rem]")} placeholder="Enter self-assessment remarks or narrative..." />
              <p className="text-xs text-muted-foreground">Optional: Provide additional context or details about the self-assessment.</p>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 3:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Registration & Legal Compliance</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="registration_type">Registration Type</Label>
              <Input id="registration_type" type="text" value={fd.registration_type || ""} onChange={(e) => set((p: any) => ({ ...p, registration_type: e.target.value }))} placeholder="e.g., Company Registration, Non-Profit Registration, etc." className="h-10 rounded-lg" />
              <p className="text-xs text-muted-foreground">Type of business registration (e.g., Section 21, Pty Ltd, etc.)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="professional_body_registration">Professional Body Registration</Label>
              <select id="professional_body_registration" value={fd.professional_body_registration == null ? "" : fd.professional_body_registration ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, professional_body_registration: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass}>
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className={docsClass}>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-500" aria-hidden /><strong className="text-blue-600 dark:text-blue-400">Required Documents:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Registration Proof (Company/Entity Registration Certificate)</li>
                <li>Tax Compliance PIN / Exemption Proof</li>
                <li>Professional Body Registration Certificate (if applicable)</li>
              </ul>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 4:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Infrastructure & Physical Resources</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="training_site_address">Training Site Address *</Label>
              <AddressAutocomplete
                id="training_site_address"
                value={(fd.training_site_address as string) || ""}
                onChange={(v) => set((p: any) => ({ ...p, training_site_address: v }))}
                onSelect={() => {}}
                placeholder="Enter full physical address of the training site..."
                countryRestrictions={["za"]}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ownership_type">Ownership Type</Label>
                <select id="ownership_type" value={fd.ownership_type || ""} onChange={(e) => set((p: any) => ({ ...p, ownership_type: e.target.value }))} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="OWNED">Owned</option>
                  <option value="LEASED">Leased</option>
                  <option value="RENTED">Rented</option>
                  <option value="PARTNERSHIP">Partnership Agreement</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="number_of_training_rooms">Number of Training Rooms</Label>
                <Input id="number_of_training_rooms" type="number" min={0} value={fd.number_of_training_rooms || ""} onChange={(e) => set((p: any) => ({ ...p, number_of_training_rooms: e.target.value }))} placeholder="e.g., 5" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_capacity">Room Capacity (per room)</Label>
                <Input id="room_capacity" type="number" min={1} value={fd.room_capacity || ""} onChange={(e) => set((p: any) => ({ ...p, room_capacity: e.target.value }))} placeholder="e.g., 20" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilitator_learner_ratio">Facilitator : Learner Ratio</Label>
                <Input id="facilitator_learner_ratio" type="text" value={fd.facilitator_learner_ratio || ""} onChange={(e) => set((p: any) => ({ ...p, facilitator_learner_ratio: e.target.value }))} placeholder="e.g., 1:15" className="h-10 rounded-lg" />
                <p className="text-xs text-muted-foreground">Format: e.g., &quot;1:15&quot; or &quot;1 facilitator per 15 learners&quot;</p>
              </div>
            </div>
            <div className={docsClass}>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-500" aria-hidden /><strong className="text-blue-600 dark:text-blue-400">Required Documents:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Proof of Ownership / Lease Agreement</li>
                <li>Furniture & Equipment Checklist</li>
                <li>Inventory Upload</li>
              </ul>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 5:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Learning Material Alignment</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="learning_material_exists">Learning Material Exists *</Label>
              <select id="learning_material_exists" value={fd.learning_material_exists == null ? "" : fd.learning_material_exists ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, learning_material_exists: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass} required>
                <option value="">Select...</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            {fd.learning_material_exists === true && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="knowledge_module_coverage">Knowledge Module Coverage (%)</Label>
                    <Input id="knowledge_module_coverage" type="number" min={0} max={100} value={fd.knowledge_module_coverage || ""} onChange={(e) => set((p: any) => ({ ...p, knowledge_module_coverage: e.target.value }))} placeholder="e.g., 75" className="h-10 rounded-lg" />
                    <p className="text-xs text-muted-foreground">Percentage of knowledge modules covered (0–100%)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="practical_module_coverage">Practical Module Coverage (%)</Label>
                    <Input id="practical_module_coverage" type="number" min={0} max={100} value={fd.practical_module_coverage || ""} onChange={(e) => set((p: any) => ({ ...p, practical_module_coverage: e.target.value }))} placeholder="e.g., 80" className="h-10 rounded-lg" />
                    <p className="text-xs text-muted-foreground">Percentage of practical modules covered (0–100%)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curriculum_alignment_confirmed">Curriculum Alignment Confirmed</Label>
                  <select id="curriculum_alignment_confirmed" value={fd.curriculum_alignment_confirmed == null ? "" : fd.curriculum_alignment_confirmed ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, curriculum_alignment_confirmed: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass}>
                    <option value="">Select...</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </>
            )}
            <div className={docsClass}>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-500" aria-hidden /><strong className="text-blue-600 dark:text-blue-400">Required Documents:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Sample Learning Material Upload (≥50% coverage required)</li>
              </ul>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 6:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Occupational Health & Safety (OHS)</h3>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fire_extinguisher_available">Fire Extinguisher Available</Label>
                <select id="fire_extinguisher_available" value={fd.fire_extinguisher_available == null ? "" : fd.fire_extinguisher_available ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, fire_extinguisher_available: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              {fd.fire_extinguisher_available === true && (
                <div className="space-y-2">
                  <Label htmlFor="fire_extinguisher_service_date">Fire Extinguisher Service Date</Label>
                  <DatePicker 
                    id="fire_extinguisher_service_date" 
                    value={fd.fire_extinguisher_service_date || ""} 
                    onChange={(e) => set((p: any) => ({ ...p, fire_extinguisher_service_date: e.target.value }))} 
                    placeholder="Select date"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="emergency_exits_marked">Emergency Exits Marked</Label>
                <select id="emergency_exits_marked" value={fd.emergency_exits_marked == null ? "" : fd.emergency_exits_marked ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, emergency_exits_marked: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessibility_for_disabilities">Accessibility for Disabilities</Label>
                <select id="accessibility_for_disabilities" value={fd.accessibility_for_disabilities == null ? "" : fd.accessibility_for_disabilities ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, accessibility_for_disabilities: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_aid_kit_available">First Aid Kit Available</Label>
                <select id="first_aid_kit_available" value={fd.first_aid_kit_available == null ? "" : fd.first_aid_kit_available ? "true" : "false"} onChange={(e) => set((p: any) => ({ ...p, first_aid_kit_available: e.target.value === "" ? null : e.target.value === "true" }))} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ohs_representative_name">OHS Representative Name</Label>
                <Input id="ohs_representative_name" type="text" value={fd.ohs_representative_name || ""} onChange={(e) => set((p: any) => ({ ...p, ohs_representative_name: e.target.value }))} placeholder="e.g., John Smith" className="h-10 rounded-lg" />
              </div>
            </div>
            <div className={docsClass}>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-500" aria-hidden /><strong className="text-blue-600 dark:text-blue-400">Required Documents:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Evacuation Plan Upload</li>
                <li>OHS Audit Report Upload</li>
                <li>OHS Appointment Letter Upload</li>
              </ul>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 7:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">LMS & Online Delivery Capability</h3>
          <div className="space-y-6">
            <div className="text-sm border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 p-3 rounded-md flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden />
              <p className="text-blue-900 dark:text-blue-200"><strong>Note:</strong> This section is required for Blended or Mobile delivery modes. Optional for Face to Face.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lms_name">LMS Name</Label>
                <Input id="lms_name" type="text" value={fd.lms_name || ""} onChange={(e) => set((p: any) => ({ ...p, lms_name: e.target.value }))} placeholder="e.g., Moodle, Canvas, Custom LMS" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_learner_capacity">Max Learner Capacity</Label>
                <Input id="max_learner_capacity" type="number" min={1} value={fd.max_learner_capacity || ""} onChange={(e) => set((p: any) => ({ ...p, max_learner_capacity: e.target.value }))} placeholder="e.g., 1000" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internet_connectivity_method">Internet Connectivity Method</Label>
                <Input id="internet_connectivity_method" type="text" value={fd.internet_connectivity_method || ""} onChange={(e) => set((p: any) => ({ ...p, internet_connectivity_method: e.target.value }))} placeholder="e.g., Fiber, ADSL, Satellite" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isp">ISP (Internet Service Provider)</Label>
                <Input id="isp" type="text" value={fd.isp || ""} onChange={(e) => set((p: any) => ({ ...p, isp: e.target.value }))} placeholder="e.g., Vodacom, MTN, Telkom" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup_frequency">Backup Frequency</Label>
                <Input id="backup_frequency" type="text" value={fd.backup_frequency || ""} onChange={(e) => set((p: any) => ({ ...p, backup_frequency: e.target.value }))} placeholder="e.g., Daily, Weekly, Real-time" className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_storage_description">Data Storage Description</Label>
              <textarea id="data_storage_description" value={fd.data_storage_description || ""} onChange={(e) => set((p: any) => ({ ...p, data_storage_description: e.target.value }))} rows={3} className={textareaClass} placeholder="Describe data storage location, method, and capacity..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security_measures_description">Security Measures Description</Label>
              <textarea id="security_measures_description" value={fd.security_measures_description || ""} onChange={(e) => set((p: any) => ({ ...p, security_measures_description: e.target.value }))} rows={3} className={textareaClass} placeholder="Describe security measures in place (encryption, access controls, etc.)..." />
            </div>
            <div className={docsClass}>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-500" aria-hidden /><strong className="text-blue-600 dark:text-blue-400">Required Documents:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>LMS Licence Proof Upload</li>
              </ul>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 8:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Workplace-Based Learning (WBL)</h3>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wbl_workplace_partner_name">Workplace Partner Name</Label>
                <Input id="wbl_workplace_partner_name" type="text" value={fd.wbl_workplace_partner_name || ""} onChange={(e) => set((p: any) => ({ ...p, wbl_workplace_partner_name: e.target.value }))} placeholder="e.g., ABC Company, XYZ Organization" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wbl_agreement_type">Agreement Type</Label>
                <Input id="wbl_agreement_type" type="text" value={fd.wbl_agreement_type || ""} onChange={(e) => set((p: any) => ({ ...p, wbl_agreement_type: e.target.value }))} placeholder="e.g., MOU, Service Agreement, Partnership" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wbl_agreement_duration">Agreement Duration</Label>
                <Input id="wbl_agreement_duration" type="text" value={fd.wbl_agreement_duration || ""} onChange={(e) => set((p: any) => ({ ...p, wbl_agreement_duration: e.target.value }))} placeholder="e.g., 12 months, 3 years, Ongoing" className="h-10 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wbl_assessment_responsibility">Assessment Responsibility</Label>
                <Input id="wbl_assessment_responsibility" type="text" value={fd.wbl_assessment_responsibility || ""} onChange={(e) => set((p: any) => ({ ...p, wbl_assessment_responsibility: e.target.value }))} placeholder="e.g., Institution, Workplace Partner, Shared" className="h-10 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wbl_components_covered">WBL Components Covered</Label>
              <textarea id="wbl_components_covered" value={fd.wbl_components_covered || ""} onChange={(e) => set((p: any) => ({ ...p, wbl_components_covered: e.target.value }))} rows={3} className={textareaClass} placeholder="Describe the WBL components covered by this agreement..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wbl_learner_support_description">Learner Support Description</Label>
              <textarea id="wbl_learner_support_description" value={fd.wbl_learner_support_description || ""} onChange={(e) => set((p: any) => ({ ...p, wbl_learner_support_description: e.target.value }))} rows={3} className={textareaClass} placeholder="Describe the support provided to learners during workplace-based learning..." />
            </div>
            <div className={docsClass}>
              <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-500" aria-hidden /><strong className="text-blue-600 dark:text-blue-400">Required Documents:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>WBL Agreement Upload</li>
                <li>Logbook Template Upload</li>
                <li>Monitoring Schedule Upload</li>
              </ul>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 9:
      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Policies & Procedures</h3>
          <div className="space-y-6">
            <div className="text-sm border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 p-3 rounded-md flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden />
              <div>
                <p className="text-blue-900 dark:text-blue-200"><strong>Note:</strong> Full policy management will be available in a future update.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policies_procedures_notes">Policies & Procedures Notes</Label>
              <textarea id="policies_procedures_notes" value={fd.policies_procedures_notes || ""} onChange={(e) => set((p: any) => ({ ...p, policies_procedures_notes: e.target.value }))} rows={5} className={textareaClass} placeholder="List policies and their status, or provide any additional information..." />
              <p className="text-xs text-muted-foreground">Required policies: Finance, HR, Teaching & Learning, Assessment, Appeals, OHS, Refunds</p>
            </div>
          </div>
          {renderDocumentUpload()}
        </div>
      );

    case 10:
      // Parse facilitators from JSON string or use empty array
      const facilitators = (() => {
        try {
          if (typeof fd.facilitators === "string") {
            return JSON.parse(fd.facilitators) || [];
          }
          return Array.isArray(fd.facilitators) ? fd.facilitators : [];
        } catch {
          return [];
        }
      })();

      return (
        <div className="space-y-8">
          <h3 className="text-lg font-semibold text-foreground">Human Resources (Facilitators)</h3>
          
          {/* Info Box */}
          <div className={docsClass}>
            <p className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-blue-500" aria-hidden />
              <span className="text-foreground">
                Add facilitators who will deliver training, assess learners, or moderate assessments for this qualification.
              </span>
            </p>
          </div>

          {/* Facilitator Manager */}
          <FacilitatorManager
            facilitators={facilitators}
            onChange={(newFacilitators) => {
              set((p: any) => ({ 
                ...p, 
                facilitators: JSON.stringify(newFacilitators),
                // Also update legacy field for backwards compatibility
                facilitators_notes: newFacilitators.length > 0 
                  ? newFacilitators.map((f: any) => `${f.fullName} (${f.roles.join(", ")})`).join("\n")
                  : ""
              }));
            }}
            canEdit={canEdit}
            readinessId={readinessId}
            institutionId={institutionId}
          />

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="facilitators_notes">Additional Notes (Optional)</Label>
            <textarea 
              id="facilitators_notes" 
              value={fd.facilitators_notes || ""} 
              onChange={(e) => set((p: any) => ({ ...p, facilitators_notes: e.target.value }))} 
              rows={3} 
              className={textareaClass} 
              placeholder="Any additional information about facilitators or training capacity..." 
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
