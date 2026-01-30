"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  User, 
  Trash2, 
  Edit2, 
  FileText, 
  Upload,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Facilitator role options
const FACILITATOR_ROLES = [
  { value: "FACILITATOR", label: "Facilitator", description: "Delivers training content" },
  { value: "ASSESSOR", label: "Assessor", description: "Evaluates learner competence" },
  { value: "MODERATOR", label: "Moderator", description: "Quality assures assessments" },
  { value: "MENTOR", label: "Mentor", description: "Provides guidance and support" },
  { value: "SUPERVISOR", label: "Supervisor", description: "Oversees workplace learning" },
] as const;

type FacilitatorRole = typeof FACILITATOR_ROLES[number]["value"];

interface FacilitatorDocument {
  fileName: string;
  uploadedAt?: string;
}

interface Facilitator {
  id: string;
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  roles: FacilitatorRole[];
  qualifications: string;
  industryExperience: string;
  yearsExperience: string;
  certifications?: string;
  // Documents
  cvDocument?: FacilitatorDocument;
  contractDocument?: FacilitatorDocument;
  saqaEvaluationDocument?: FacilitatorDocument;
  workPermitDocument?: FacilitatorDocument;
}

interface FacilitatorManagerProps {
  facilitators: Facilitator[];
  onChange: (facilitators: Facilitator[]) => void;
  canEdit?: boolean;
  readinessId?: string;
  institutionId?: string;
}

const EMPTY_FACILITATOR: Omit<Facilitator, "id"> = {
  fullName: "",
  idNumber: "",
  email: "",
  phone: "",
  roles: [],
  qualifications: "",
  industryExperience: "",
  yearsExperience: "",
  certifications: "",
  cvDocument: undefined,
  contractDocument: undefined,
  saqaEvaluationDocument: undefined,
  workPermitDocument: undefined,
};

// Document types for facilitators
const FACILITATOR_DOCUMENTS = [
  { key: "cvDocument" as const, label: "CV / Resume", description: "Curriculum Vitae or Resume" },
  { key: "contractDocument" as const, label: "Contract / SLA", description: "Service Level Agreement or Employment Contract" },
  { key: "saqaEvaluationDocument" as const, label: "SAQA Evaluation", description: "SAQA qualification evaluation certificate" },
  { key: "workPermitDocument" as const, label: "Work Permit", description: "Work permit (for foreign nationals)" },
];

/**
 * FacilitatorManager Component
 * 
 * Comprehensive facilitator management for Form 5 Step 10
 * Features:
 * - Add/Edit/Remove facilitators
 * - Assign multiple roles
 * - Track qualifications and experience
 * - Link CV documents
 * - Validation feedback
 */
export function FacilitatorManager({
  facilitators,
  onChange,
  canEdit = true,
  readinessId,
  institutionId,
}: FacilitatorManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFacilitator, setEditingFacilitator] = useState<Facilitator | null>(null);
  const [formData, setFormData] = useState<Omit<Facilitator, "id">>(EMPTY_FACILITATOR);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [eligible, setEligible] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [addFromInstitutionLoading, setAddFromInstitutionLoading] = useState(false);
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null);

  const generateId = () => `fac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

  useEffect(() => {
    if (!readinessId || !canEdit) return;
    setEligibleLoading(true);
    fetch(`/api/institutions/readiness/${readinessId}/facilitators/eligible`)
      .then((r) => r.json())
      .then((data) => setEligible(data?.eligible ?? []))
      .catch(() => setEligible([]))
      .finally(() => setEligibleLoading(false));
  }, [readinessId, canEdit]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "ID/Passport number is required";
    }
    if (formData.roles.length === 0) {
      newErrors.roles = "At least one role is required";
    }
    if (!formData.qualifications.trim()) {
      newErrors.qualifications = "Qualifications are required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingFacilitator(null);
    setFormData(EMPTY_FACILITATOR);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (facilitator: Facilitator) => {
    setEditingFacilitator(facilitator);
    setFormData({
      fullName: facilitator.fullName,
      idNumber: facilitator.idNumber,
      email: facilitator.email,
      phone: facilitator.phone,
      roles: facilitator.roles,
      qualifications: facilitator.qualifications,
      industryExperience: facilitator.industryExperience,
      yearsExperience: facilitator.yearsExperience,
      certifications: facilitator.certifications,
      cvDocument: facilitator.cvDocument,
      contractDocument: facilitator.contractDocument,
      saqaEvaluationDocument: facilitator.saqaEvaluationDocument,
      workPermitDocument: facilitator.workPermitDocument,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (editingFacilitator) {
      // Update existing
      const updated = facilitators.map((f) =>
        f.id === editingFacilitator.id ? { ...f, ...formData } : f
      );
      onChange(updated);
    } else {
      // Add new
      const newFacilitator: Facilitator = {
        id: generateId(),
        ...formData,
      };
      onChange([...facilitators, newFacilitator]);
    }
    
    setDialogOpen(false);
    setFormData(EMPTY_FACILITATOR);
    setEditingFacilitator(null);
  };

  const handleRemove = async (id: string) => {
    if (readinessId && isUuid(id)) {
      setRemoveLoadingId(id);
      try {
        const res = await fetch(`/api/institutions/readiness/${readinessId}/facilitators/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove");
      } catch (e) {
        console.error(e);
        setRemoveLoadingId(null);
        return;
      }
      setRemoveLoadingId(null);
    }
    onChange(facilitators.filter((f) => f.id !== id));
  };

  const handleAddFromInstitution = async (userId: string) => {
    if (!readinessId) return;
    setAddFromInstitutionLoading(true);
    try {
      const res = await fetch(`/api/institutions/readiness/${readinessId}/facilitators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to add");
      }
      const data = await res.json();
      const f = data.facilitator;
      const newOne: Facilitator & { userId?: string } = {
        id: f.facilitator_id,
        userId: f.user_id,
        fullName: `${f.first_name || ""} ${f.last_name || ""}`.trim(),
        idNumber: f.id_number || "",
        email: f.user?.email || "",
        phone: "",
        roles: ["FACILITATOR"],
        qualifications: f.qualifications || "",
        industryExperience: f.industry_experience || "",
        yearsExperience: "",
        certifications: "",
      };
      onChange([...facilitators, newOne]);
    } catch (e) {
      console.error(e);
    } finally {
      setAddFromInstitutionLoading(false);
    }
  };

  const toggleRole = (role: FacilitatorRole) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isComplete = (facilitator: Facilitator): boolean => {
    return !!(
      facilitator.fullName &&
      facilitator.idNumber &&
      facilitator.roles.length > 0 &&
      facilitator.qualifications
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Facilitators ({facilitators.length})</h4>
          <p className="text-xs text-muted-foreground">At least one facilitator is required</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {readinessId && (
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value=""
                disabled={eligibleLoading || addFromInstitutionLoading}
                onChange={(e) => {
                  const v = e.target.value;
                  e.target.value = "";
                  if (v) handleAddFromInstitution(v);
                }}
              >
                <option value="">
                  {eligibleLoading ? "Loading…" : "Add from institution…"}
                </option>
                {eligible
                  .filter((u) => !facilitators.some((f) => (f as { userId?: string }).userId === u.user_id))
                  .map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
              </select>
            )}
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Facilitator
            </Button>
          </div>
        )}
      </div>

      {/* Validation Status */}
      {facilitators.length === 0 && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              No facilitators added yet
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-7">
            Add at least one facilitator with their qualifications and role to complete this section.
          </p>
        </div>
      )}

      {/* Facilitator Cards */}
      <div className="space-y-3">
        {facilitators.map((facilitator, index) => (
          <div
            key={facilitator.id}
            className={cn(
              "rounded-lg border transition-all",
              isComplete(facilitator) 
                ? "border-emerald-400/40 bg-emerald-500/5" 
                : "border-amber-400/40 bg-amber-500/5"
            )}
          >
            {/* Card Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleExpand(facilitator.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  isComplete(facilitator) 
                    ? "bg-emerald-500/20" 
                    : "bg-amber-500/20"
                )}>
                  <User className={cn(
                    "h-5 w-5",
                    isComplete(facilitator) ? "text-emerald-600" : "text-amber-600"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{facilitator.fullName || "Unnamed Facilitator"}</p>
                    {isComplete(facilitator) ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {facilitator.roles.map((role) => (
                      <Badge 
                        key={role} 
                        variant="secondary" 
                        className="text-xs bg-primary/10 text-primary border-0"
                      >
                        {FACILITATOR_ROLES.find((r) => r.value === role)?.label || role}
                      </Badge>
                    ))}
                    {facilitator.roles.length === 0 && (
                      <span className="text-xs text-muted-foreground">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(facilitator);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(facilitator.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {expandedId === facilitator.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === facilitator.id && (
              <div className="px-4 pb-4 border-t border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">ID/Passport</p>
                    <p className="text-sm text-foreground">{facilitator.idNumber || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{facilitator.email || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm text-foreground">{facilitator.phone || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Years of Experience</p>
                    <p className="text-sm text-foreground">{facilitator.yearsExperience || "—"}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Qualifications</p>
                    <p className="text-sm text-foreground">{facilitator.qualifications || "—"}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Industry Experience</p>
                    <p className="text-sm text-foreground">{facilitator.industryExperience || "—"}</p>
                  </div>
                  {facilitator.certifications && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground">Certifications</p>
                      <p className="text-sm text-foreground">{facilitator.certifications}</p>
                    </div>
                  )}
                  {/* Documents */}
                  {(facilitator.cvDocument || facilitator.contractDocument || facilitator.saqaEvaluationDocument || facilitator.workPermitDocument) && (
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground">Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {facilitator.cvDocument && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-400/30">
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">CV</span>
                          </div>
                        )}
                        {facilitator.contractDocument && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-400/30">
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">Contract</span>
                          </div>
                        )}
                        {facilitator.saqaEvaluationDocument && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-400/30">
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">SAQA Eval</span>
                          </div>
                        )}
                        {facilitator.workPermitDocument && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-400/30">
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">Work Permit</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden">
          <DialogHeader>
            <DialogTitle>
              {editingFacilitator ? "Edit Facilitator" : "Add Facilitator"}
            </DialogTitle>
            <DialogDescription>
              Enter the facilitator's details, qualifications, and assign their roles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <User className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Personal Information</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="e.g., John Doe"
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID/Passport Number *</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, idNumber: e.target.value }))}
                    placeholder="e.g., 8501015009087"
                  />
                  {errors.idNumber && (
                    <p className="text-xs text-destructive">{errors.idNumber}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="e.g., john@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g., 082 123 4567"
                  />
                </div>
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Briefcase className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Roles *</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {FACILITATOR_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value)}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                      formData.roles.includes(role.value)
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                  >
                    <span className="text-sm font-medium">{role.label}</span>
                    <span className="text-xs text-muted-foreground">{role.description}</span>
                  </button>
                ))}
              </div>
              {errors.roles && (
                <p className="text-xs text-destructive">{errors.roles}</p>
              )}
            </div>

            {/* Qualifications & Experience */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Qualifications & Experience</h4>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qualifications">Qualifications *</Label>
                  <textarea
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={(e) => setFormData((p) => ({ ...p, qualifications: e.target.value }))}
                    placeholder="e.g., National Diploma in Electrical Engineering, Trade Test Certificate..."
                    rows={3}
                    className={cn(
                      "flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      errors.qualifications && "border-destructive"
                    )}
                  />
                  {errors.qualifications && (
                    <p className="text-xs text-destructive">{errors.qualifications}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                    <Input
                      id="yearsExperience"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData((p) => ({ ...p, yearsExperience: e.target.value }))}
                      placeholder="e.g., 5 years"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications</Label>
                    <Input
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData((p) => ({ ...p, certifications: e.target.value }))}
                      placeholder="e.g., Assessor Certificate, Moderator Certificate"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industryExperience">Industry Experience</Label>
                  <textarea
                    id="industryExperience"
                    value={formData.industryExperience}
                    onChange={(e) => setFormData((p) => ({ ...p, industryExperience: e.target.value }))}
                    placeholder="Describe relevant industry experience..."
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <FileText className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Documents</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FACILITATOR_DOCUMENTS.map((docType) => {
                  const doc = formData[docType.key];
                  const inputId = `doc-upload-${docType.key}`;
                  
                  return (
                    <div key={docType.key} className="space-y-2">
                      <Label className="text-xs">{docType.label}</Label>
                      {doc?.fileName ? (
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-400/40 bg-emerald-500/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <p className="text-xs font-medium text-foreground truncate">{doc.fileName}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive shrink-0"
                            onClick={() => setFormData((p) => ({ ...p, [docType.key]: undefined }))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-blue-400 dark:hover:border-blue-600 hover:bg-accent/50 transition-all cursor-pointer"
                          onClick={() => document.getElementById(inputId)?.click()}
                        >
                          <input
                            id={inputId}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData((p) => ({ 
                                  ...p, 
                                  [docType.key]: { 
                                    fileName: file.name, 
                                    uploadedAt: new Date().toISOString() 
                                  } 
                                }));
                              }
                              e.target.value = "";
                            }}
                          />
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">{docType.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {editingFacilitator ? "Save Changes" : "Add Facilitator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
