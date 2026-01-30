import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Shield,
  Building2,
  BookOpen,
  Users,
  Monitor,
  Briefcase,
  FileSignature,
  CheckCircle2,
  XCircle,
  MapPin,
  AlertCircle,
} from "lucide-react";
// Using simple card structure - sections are always visible for review

interface ReadinessContentDisplayProps {
  readiness: any; // Full readiness record with all fields
  sectionReviews?: Array<{
    section_name: string;
    criterion_key?: string;
    response?: string;
    mandatory_remarks?: string;
    notes?: string;
  }>;
}

/**
 * Full Readiness Content Display Component
 * 
 * Displays all Form 5 sections in read-only mode for QCTO review.
 * Shows completion %, missing required fields, and reviewer notes if available.
 * Sections are organized according to official Form 5 structure.
 */
export function ReadinessContentDisplay({ readiness, sectionReviews = [] }: ReadinessContentDisplayProps) {
  const deliveryMode = readiness.delivery_mode;
  const isFaceToFace = deliveryMode === "FACE_TO_FACE";
  const isBlended = deliveryMode === "BLENDED";
  const isMobile = deliveryMode === "MOBILE";

  // Helper to get section review notes
  const getSectionReview = (sectionName: string) => {
    return sectionReviews.find((r) => r.section_name === sectionName);
  };

  // Helper to format Yes/No display
  const formatYesNo = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return null;
    return value ? (
      <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold">
        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-500" /> No
      </span>
    );
  };

  // Helper to calculate section completion
  const getSectionCompletion = (sectionName: string): number => {
    if (!readiness.section_completion_data || typeof readiness.section_completion_data !== "object") {
      return 0;
    }
    const completionData = readiness.section_completion_data as Record<string, { completed?: number }>;
    return completionData[sectionName]?.completed || 0;
  };

  return (
    <div className="space-y-6">
      {/* Section 3.1: Self-Assessment */}
      {readiness.self_assessment_completed !== null && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Section 3.1: Self-Assessment</CardTitle>
                  <CardDescription>Self-assessment completion and remarks</CardDescription>
                </div>
              </div>
              {getSectionCompletion("section_3_1_self_assessment") > 0 && (
                <Badge variant="outline">
                  {getSectionCompletion("section_3_1_self_assessment")}% Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
                    <ClipboardCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Self-Assessment Completed
                      </span>
                      <p className="mt-1">{formatYesNo(readiness.self_assessment_completed)}</p>
                    </div>
                  </div>
                  {readiness.self_assessment_remarks && (
                    <div className="rounded-xl bg-emerald-50/40 dark:bg-emerald-900/20 p-4">
                      <span className="text-xs font-medium text-emerald-800/80 dark:text-emerald-300 uppercase tracking-wider">
                        Remarks / Narrative
                      </span>
                      <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                        {readiness.self_assessment_remarks}
                      </p>
                    </div>
                  )}
                  {getSectionReview("section_3_1_self_assessment") && (
                    <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-200">
                      <span className="text-xs font-medium text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                        Reviewer Notes
                      </span>
                      <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">
                        {getSectionReview("section_3_1_self_assessment")?.mandatory_remarks || 
                         getSectionReview("section_3_1_self_assessment")?.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 3.2: Registration & Legal Compliance */}
      {(readiness.registration_type || readiness.professional_body_registration !== null) && (
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <Shield className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <CardTitle>Section 3.2: Registration & Legal Compliance</CardTitle>
                  <CardDescription>Registration type and professional body registration</CardDescription>
                </div>
              </div>
              {getSectionCompletion("section_3_2_registration") > 0 && (
                <Badge variant="outline">
                  {getSectionCompletion("section_3_2_registration")}% Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
                  {readiness.registration_type && (
                    <div className="flex gap-3 rounded-xl bg-violet-50/50 dark:bg-violet-900/20 p-4">
                      <Shield className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Registration Type
                        </span>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                          {readiness.registration_type}
                        </p>
                      </div>
                    </div>
                  )}
                  {readiness.professional_body_registration !== null && (
                    <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
                      <Shield className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Professional Body Registration
                        </span>
                        <p className="mt-1">{formatYesNo(readiness.professional_body_registration)}</p>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Required Documents:</strong> CIPC/Registration Proof, Valid Tax Compliance PIN or SARS
                      Exemption, SAQA registration (if Professional Body)
                    </p>
                  </div>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 3.3: Face-to-Face/Physical Delivery Readiness (Conditional) */}
      {(isFaceToFace || isBlended) && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Section 3.3: Face-to-Face/Physical Delivery Readiness</CardTitle>
                  <CardDescription>
                    3.3.1 Property & Premises • 3.3.2 HR Capacity • 3.3.3 Facilitators • 3.3.4 Contracts
                  </CardDescription>
                </div>
              </div>
              {getSectionCompletion("section_3_3_physical_delivery") > 0 && (
                <Badge variant="outline">
                  {getSectionCompletion("section_3_3_physical_delivery")}% Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-6">
                  {/* 3.3.1 Property & Premises */}
                  {(readiness.training_site_address || readiness.ownership_type) && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">3.3.1 Property & Premises</h4>
                      <div className="space-y-3">
                        {readiness.training_site_address && (
                          <div className="flex gap-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 p-4">
                            <MapPin className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Training Site Address
                              </span>
                              <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                                {readiness.training_site_address}
                              </p>
                            </div>
                          </div>
                        )}
                        {readiness.ownership_type && (
                          <div className="flex gap-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 p-4">
                            <Building2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Ownership Type
                              </span>
                              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                                {readiness.ownership_type}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                          <p className="text-sm text-blue-900 dark:text-blue-200">
                            <strong>Required:</strong> Proof of ownership OR valid lease agreement (not expired)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3.3.2 Human Resource Capacity (Management) */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">3.3.2 Human Resource Capacity (Management)</h4>
                    <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        <strong>Required Documents:</strong> Organogram with roles & reporting lines, Quality assurance
                        processes, Monitoring tools
                      </p>
                    </div>
                  </div>

                  {/* 3.3.3 & 3.3.4 Facilitators - Note about Facilitator model */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                      3.3.3 Facilitators & 3.3.4 Facilitator Contracts
                    </h4>
                    <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                      <p className="text-sm text-blue-900 dark:text-blue-200">
                        <strong>Required per Facilitator:</strong> ID/Passport, Qualifications, CVs (within 6 months),
                        Employment contract or SLA. Non-SA facilitators require SAQA evaluation, valid work permit, valid
                        visa/passport.
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
                        Facilitator details are managed separately. Check Facilitators section for full details.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 3.4: Physical Resources – Knowledge Module */}
      {(readiness.number_of_training_rooms ||
        readiness.room_capacity ||
        readiness.facilitator_learner_ratio) && (
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                  <BookOpen className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <CardTitle>Section 3.4: Physical Resources – Knowledge Module</CardTitle>
                  <CardDescription>Training rooms, furniture, equipment, and ratios</CardDescription>
                </div>
              </div>
              {getSectionCompletion("section_3_4_knowledge_resources") > 0 && (
                <Badge variant="outline">
                  {getSectionCompletion("section_3_4_knowledge_resources")}% Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {readiness.number_of_training_rooms && (
                    <div className="flex gap-3 rounded-xl bg-sky-50/50 dark:bg-sky-900/20 p-4">
                      <Building2 className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Number of Training Rooms
                        </span>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                          {readiness.number_of_training_rooms}
                        </p>
                      </div>
                    </div>
                  )}
                  {readiness.room_capacity && (
                    <div className="flex gap-3 rounded-xl bg-sky-50/50 dark:bg-sky-900/20 p-4">
                      <Users className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Room Capacity
                        </span>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                          {readiness.room_capacity} learners per room
                        </p>
                      </div>
                    </div>
                  )}
                  {readiness.facilitator_learner_ratio && (
                    <div className="flex gap-3 rounded-xl bg-sky-50/50 dark:bg-sky-900/20 p-4">
                      <Users className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Facilitator : Learner Ratio
                        </span>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                          {readiness.facilitator_learner_ratio}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3 mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Required Documents:</strong> Furniture & Equipment Checklist, Inventory lists, Resource
                    checklist aligned to curriculum
                  </p>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 3.5: Practical Module Resources */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <Briefcase className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>Section 3.5: Practical Module Resources</CardTitle>
              <CardDescription>Workshop/simulation venue, tools, equipment, and consumables</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Required Documents:</strong> Workshop/simulation venue details, Tools/equipment/consumables
              inventory, Practical inventory lists, Alignment with curriculum requirements
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3.6: Workplace-Based Learning (WBL) */}
      {(readiness.wbl_workplace_partner_name ||
        readiness.wbl_agreement_type ||
        readiness.wbl_components_covered) && (
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
                  <Briefcase className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle>Section 3.6: Workplace-Based Learning (WBL)</CardTitle>
                  <CardDescription>WBL partnership agreements and support mechanisms</CardDescription>
                </div>
              </div>
              {getSectionCompletion("section_3_6_wbl") > 0 && (
                <Badge variant="outline">{getSectionCompletion("section_3_6_wbl")}% Complete</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {readiness.wbl_workplace_partner_name && (
                      <div className="flex gap-3 rounded-xl bg-teal-50/50 dark:bg-teal-900/20 p-4">
                        <Briefcase className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Workplace Partner Name
                          </span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {readiness.wbl_workplace_partner_name}
                          </p>
                        </div>
                      </div>
                    )}
                    {readiness.wbl_agreement_type && (
                      <div className="flex gap-3 rounded-xl bg-teal-50/50 dark:bg-teal-900/20 p-4">
                        <FileSignature className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Agreement Type
                          </span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {readiness.wbl_agreement_type}
                          </p>
                        </div>
                      </div>
                    )}
                    {readiness.wbl_agreement_duration && (
                      <div className="flex gap-3 rounded-xl bg-teal-50/50 dark:bg-teal-900/20 p-4">
                        <AlertCircle className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Agreement Duration
                          </span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {readiness.wbl_agreement_duration}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {readiness.wbl_components_covered && (
                    <div className="rounded-xl bg-teal-50/50 dark:bg-teal-900/20 p-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        WBL Components Covered
                      </span>
                      <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                        {readiness.wbl_components_covered}
                      </p>
                    </div>
                  )}
                  {readiness.wbl_learner_support_description && (
                    <div className="rounded-xl bg-teal-50/50 dark:bg-teal-900/20 p-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Learner Support Description
                      </span>
                      <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                        {readiness.wbl_learner_support_description}
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Required Documents:</strong> MoU/SLA/Partnership Agreement, Logbooks, Workplace monitoring
                      schedule, Learner support mechanism
                    </p>
                  </div>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 4: Hybrid/Blended Delivery Mode (Conditional) */}
      {isBlended && (
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Monitor className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <CardTitle>Section 4: Hybrid/Blended Delivery Mode</CardTitle>
                <CardDescription>
                  4.1 Online Delivery • 4.2 Knowledge Module via LMS • 4.3 Practical Module • 4.4 Workplace Module
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-6">
                  {/* 4.1 Online Delivery Management */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">4.1 Online Delivery Management</h4>
                    <div className="space-y-3">
                      {readiness.lms_name && (
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">LMS Name</span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.lms_name}</p>
                        </div>
                      )}
                      {readiness.internet_connectivity_method && (
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Internet Connectivity Method
                          </span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {readiness.internet_connectivity_method}
                          </p>
                        </div>
                      )}
                      {readiness.isp && (
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ISP</span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{readiness.isp}</p>
                        </div>
                      )}
                      {readiness.backup_frequency && (
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Backup Frequency
                          </span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {readiness.backup_frequency}
                          </p>
                        </div>
                      )}
                      {readiness.data_storage_description && (
                        <div className="rounded-xl bg-cyan-50/50 dark:bg-cyan-900/20 p-4">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Data Storage Description
                          </span>
                          <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                            {readiness.data_storage_description}
                          </p>
                        </div>
                      )}
                      {readiness.security_measures_description && (
                        <div className="rounded-xl bg-cyan-50/50 dark:bg-cyan-900/20 p-4">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Security Measures Description
                          </span>
                          <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                            {readiness.security_measures_description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Required:</strong> Documented LMS implementation process, Licensed operating systems,
                      Licensed LMS, ISP contract, Data backup & protection process
                    </p>
                  </div>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 5: Mobile Unit Delivery Mode (Conditional) */}
      {isMobile && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Section 5: Mobile Unit Delivery Mode</CardTitle>
                <CardDescription>Mobile unit ownership, capacity, and implementation plan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
                <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Required Documents:</strong> Proof of mobile unit ownership, Capacity aligned with
                    enrolments, Inventory lists (knowledge & practical), Accredited scope confirmation, Learner uptake
                    justification, Practical implementation plan
                  </p>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 6: Learner Management Information System (LMIS) */}
      {(readiness.lmis_functional !== null ||
        readiness.lmis_popia_compliant !== null ||
        readiness.lmis_data_storage_description) && (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Monitor className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle>Section 6: Learner Management Information System (LMIS)</CardTitle>
                  <CardDescription>LMIS functionality, POPIA compliance, and data management</CardDescription>
                </div>
              </div>
              {getSectionCompletion("section_6_lmis") > 0 && (
                <Badge variant="outline">{getSectionCompletion("section_6_lmis")}% Complete</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {readiness.lmis_functional !== null && (
                      <div className="flex gap-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 p-4">
                        <Monitor className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Functional LMIS
                          </span>
                          <p className="mt-1">{formatYesNo(readiness.lmis_functional)}</p>
                        </div>
                      </div>
                    )}
                    {readiness.lmis_popia_compliant !== null && (
                      <div className="flex gap-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 p-4">
                        <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            POPIA Compliant
                          </span>
                          <p className="mt-1">{formatYesNo(readiness.lmis_popia_compliant)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {readiness.lmis_data_storage_description && (
                    <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 p-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Data Storage & Backups
                      </span>
                      <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                        {readiness.lmis_data_storage_description}
                      </p>
                    </div>
                  )}
                  {readiness.lmis_access_control_description && (
                    <div className="rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 p-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Controlled Access to Learner Data
                      </span>
                      <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                        {readiness.lmis_access_control_description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 7: Policies & Procedures */}
      {readiness.policies_procedures_notes && (
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10">
                <FileSignature className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle>Section 7: Policies & Procedures</CardTitle>
                <CardDescription>Mandatory policies and learner support mechanisms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
                  {readiness.policies_procedures_notes && (
                    <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Policies & Procedures Notes
                      </span>
                      <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700 dark:text-slate-300">
                        {readiness.policies_procedures_notes}
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Mandatory Policies:</strong> Finance, HR, Teaching & Learning, Assessment (QCTO-aligned),
                      Appeals, Refund Policy, OHS
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                      <strong>Learner Support:</strong> Before/during/after training, Career pathway mapping
                    </p>
                  </div>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 8: Occupational Health & Safety (OHS) */}
      {(readiness.fire_extinguisher_available !== null ||
        readiness.emergency_exits_marked !== null ||
        readiness.ohs_representative_name) && (
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                  <Shield className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <CardTitle>Section 8: Occupational Health & Safety (OHS)</CardTitle>
                  <CardDescription>OHS compliance and safety requirements</CardDescription>
                </div>
              </div>
              {getSectionCompletion("section_8_ohs") > 0 && (
                <Badge variant="outline">{getSectionCompletion("section_8_ohs")}% Complete</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {readiness.fire_extinguisher_available !== null && (
                    <div className="flex gap-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 p-4">
                      <Shield className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Fire Extinguisher Available
                        </span>
                        <p className="mt-1">{formatYesNo(readiness.fire_extinguisher_available)}</p>
                        {readiness.fire_extinguisher_service_date && (
                          <p className="text-xs text-slate-500 mt-1">
                            Service Date: {new Date(readiness.fire_extinguisher_service_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {readiness.emergency_exits_marked !== null && (
                    <div className="flex gap-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 p-4">
                      <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Emergency Exits Marked
                        </span>
                        <p className="mt-1">{formatYesNo(readiness.emergency_exits_marked)}</p>
                      </div>
                    </div>
                  )}
                  {readiness.accessibility_for_disabilities !== null && (
                    <div className="flex gap-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 p-4">
                      <Users className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Accessibility for Disabilities
                        </span>
                        <p className="mt-1">{formatYesNo(readiness.accessibility_for_disabilities)}</p>
                      </div>
                    </div>
                  )}
                  {readiness.first_aid_kit_available !== null && (
                    <div className="flex gap-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 p-4">
                      <Shield className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          First Aid Kit Available
                        </span>
                        <p className="mt-1">{formatYesNo(readiness.first_aid_kit_available)}</p>
                      </div>
                    </div>
                  )}
                  {readiness.ohs_representative_name && (
                    <div className="flex gap-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/20 p-4">
                      <Users className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          OHS Representative
                        </span>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                          {readiness.ohs_representative_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-blue-200/60 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-3 mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Required Documents:</strong> Evacuation plans, OHS audit report (≤12 months), OHS appointment
                    letter
                  </p>
                </div>
              </CardContent>
          </Card>
      )}

      {/* Section 9: Learning Material */}
      {(readiness.learning_material_exists !== null ||
        readiness.learning_material_coverage_percentage !== null ||
        readiness.knowledge_module_coverage !== null) && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Section 9: Learning Material</CardTitle>
                  <CardDescription>
                    Learning material coverage (≥50% required), NQF alignment, and quality verification
                  </CardDescription>
                </div>
              </div>
              {readiness.learning_material_coverage_percentage !== null && (
                <Badge
                  variant={readiness.learning_material_coverage_percentage >= 50 ? "default" : "destructive"}
                >
                  {readiness.learning_material_coverage_percentage}% Coverage
                  {readiness.learning_material_coverage_percentage < 50 && " (Below 50%)"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {readiness.learning_material_exists !== null && (
                      <div className="flex gap-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 p-4">
                        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Learning Material Exists
                          </span>
                          <p className="mt-1">{formatYesNo(readiness.learning_material_exists)}</p>
                        </div>
                      </div>
                    )}
                    {readiness.learning_material_coverage_percentage !== null && (
                      <div className="flex gap-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 p-4">
                        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Coverage Percentage
                          </span>
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {readiness.learning_material_coverage_percentage}%
                            {readiness.learning_material_coverage_percentage < 50 && (
                              <span className="text-red-600 dark:text-red-400 ml-2">(Below 50% requirement)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    {readiness.learning_material_nqf_aligned !== null && (
                      <div className="flex gap-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 p-4">
                        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            NQF Level Aligned
                          </span>
                          <p className="mt-1">{formatYesNo(readiness.learning_material_nqf_aligned)}</p>
                        </div>
                      </div>
                    )}
                    {readiness.knowledge_components_complete !== null && (
                      <div className="flex gap-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 p-4">
                        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Knowledge Components Complete
                          </span>
                          <p className="mt-1">{formatYesNo(readiness.knowledge_components_complete)}</p>
                        </div>
                      </div>
                    )}
                    {readiness.practical_components_complete !== null && (
                      <div className="flex gap-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 p-4">
                        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Practical Components Complete
                          </span>
                          <p className="mt-1">{formatYesNo(readiness.practical_components_complete)}</p>
                        </div>
                      </div>
                    )}
                    {readiness.learning_material_quality_verified !== null && (
                      <div className="flex gap-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 p-4">
                        <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Quality & Understandability Verified
                          </span>
                          <p className="mt-1">{formatYesNo(readiness.learning_material_quality_verified)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {(readiness.knowledge_module_coverage !== null || readiness.practical_module_coverage !== null) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {readiness.knowledge_module_coverage !== null && (
                        <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
                          <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Knowledge Module Coverage
                            </span>
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                              {readiness.knowledge_module_coverage}%
                            </p>
                          </div>
                        </div>
                      )}
                      {readiness.practical_module_coverage !== null && (
                        <div className="flex gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-4">
                          <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Practical Module Coverage
                            </span>
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                              {readiness.practical_module_coverage}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="rounded-lg border border-amber-200/60 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/20 p-3">
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      <strong>Form 5 Requirement:</strong> Learning material must cover ≥50% of curriculum, be aligned
                      to NQF level, and have complete knowledge & practical components.
                    </p>
                  </div>
                </div>
              </CardContent>
          </Card>
      )}
    </div>
  );
}
