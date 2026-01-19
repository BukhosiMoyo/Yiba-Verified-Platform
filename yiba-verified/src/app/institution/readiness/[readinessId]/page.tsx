import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ReadinessEditForm } from "@/components/institution/ReadinessEditForm";
import { ReadinessCompletionSummary } from "@/components/institution/ReadinessCompletionSummary";

interface PageProps {
  params: Promise<{
    readinessId: string;
  }>;
}

/**
 * Institution Readiness Detail Page
 * 
 * Server Component that displays readiness record details and editing form.
 * - Fetches readiness from DB directly (read-only)
 * - Enforces institution scoping:
 *   - INSTITUTION_* roles: must match ctx institution_id
 *   - PLATFORM_ADMIN: can view ALL readiness records (no institution scoping - app owners see everything!)
 * - Ignores soft-deleted readiness records (deleted_at must be null)
 */
export default async function InstitutionReadinessDetailPage({ params }: PageProps) {
  const { readinessId } = await params;

  // Get session (layout already ensures auth, but we need role/institutionId for scoping)
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    readiness_id: readinessId,
    deleted_at: null, // Only non-deleted
  };

  // Enforce institution scoping rules
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles can only view readiness from their own institution
    if (!userInstitutionId) {
      redirect("/unauthorized");
    }
    where.institution_id = userInstitutionId;
  }
  // PLATFORM_ADMIN can view ALL readiness records (no institution scoping check - app owners see everything! 🦸)

  // Fetch readiness from database
  const readiness = await prisma.readiness.findFirst({
    where,
    include: {
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
        },
      },
      documents: {
        orderBy: { uploaded_at: "desc" },
        select: {
          document_id: true,
          file_name: true,
          file_type: true,
          file_size: true,
          uploaded_at: true,
          uploaded_by: true,
        },
      },
      recommendation: {
        include: {
          recommendedByUser: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      },
      _count: {
        select: {
          documents: true,
        },
      },
    },
  });

  if (!readiness) {
    notFound();
  }

  // Format status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "NOT_STARTED":
        return "outline";
      case "IN_PROGRESS":
        return "secondary";
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return "default";
      case "RECOMMENDED":
      case "REVIEWED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "RETURNED_FOR_CORRECTION":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Format status label
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Check if can edit (institutions can only edit NOT_STARTED or IN_PROGRESS)
  const canEdit = userRole === "PLATFORM_ADMIN" || 
                  (readiness.readiness_status === "NOT_STARTED" || readiness.readiness_status === "IN_PROGRESS");

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Form 5 Readiness</h1>
            <p className="text-muted-foreground mt-2">
              {readiness.qualification_title}
            </p>
          </div>
          <Link href="/institution/readiness">
            <span className="text-sm text-primary hover:underline">← Back to Readiness Records</span>
          </Link>
        </div>
      </div>

      {/* Status and Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Readiness Details</CardTitle>
            <Badge variant={getStatusVariant(readiness.readiness_status)}>
              {formatStatus(readiness.readiness_status)}
            </Badge>
          </div>
          <CardDescription>
            Form 5 readiness record for qualification delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Qualification Title</span>
              <p className="text-lg font-medium">{readiness.qualification_title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">SAQA ID</span>
              <p className="text-lg font-mono">{readiness.saqa_id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">NQF Level</span>
              <p className="text-lg">{readiness.nqf_level || "—"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Curriculum Code</span>
              <p className="text-lg font-mono">{readiness.curriculum_code}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Delivery Mode</span>
              <p className="text-lg">
                <Badge variant="outline">{readiness.delivery_mode.replace(/_/g, " ")}</Badge>
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Documents</span>
              <p className="text-lg">{readiness._count.documents} documents uploaded</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Created</span>
              <p className="text-sm text-muted-foreground">{formatDate(readiness.created_at)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
              <p className="text-sm text-muted-foreground">{formatDate(readiness.updated_at)}</p>
            </div>
            {readiness.submission_date && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Submitted</span>
                <p className="text-sm text-muted-foreground">{formatDate(readiness.submission_date)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Self-Assessment Section Display */}
      {(readiness.self_assessment_completed !== null || readiness.self_assessment_remarks) && (
        <Card>
          <CardHeader>
            <CardTitle>Self-Assessment</CardTitle>
            <CardDescription>
              Self-assessment information for this readiness record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Self-Assessment Completed</span>
                <p className="text-lg">
                  {readiness.self_assessment_completed === null ? (
                    <span className="text-muted-foreground italic">Not answered</span>
                  ) : readiness.self_assessment_completed ? (
                    <span className="text-green-600 font-medium">Yes ✓</span>
                  ) : (
                    <span className="text-red-600 font-medium">No ✗</span>
                  )}
                </p>
              </div>
              {readiness.self_assessment_remarks && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Remarks / Narrative</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {readiness.self_assessment_remarks}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration & Legal Compliance Section Display */}
      {((readiness as any).registration_type || (readiness as any).professional_body_registration !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Registration & Legal Compliance</CardTitle>
            <CardDescription>
              Registration and legal compliance information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(readiness as any).registration_type && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Registration Type</span>
                  <p className="text-lg">{(readiness as any).registration_type}</p>
                </div>
              )}
              {(readiness as any).professional_body_registration !== null && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Professional Body Registration</span>
                  <p className="text-lg">
                    {(readiness as any).professional_body_registration ? (
                      <span className="text-green-600 font-medium">Yes ✓</span>
                    ) : (
                      <span className="text-red-600 font-medium">No ✗</span>
                    )}
                  </p>
                </div>
              )}
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Documents:</strong> Registration Proof, Tax Compliance PIN, Professional Body Registration (if applicable)</p>
                <p className="mt-1">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Infrastructure & Physical Resources Section Display */}
      {((readiness as any).training_site_address || 
        (readiness as any).ownership_type || 
        (readiness as any).number_of_training_rooms || 
        (readiness as any).room_capacity || 
        (readiness as any).facilitator_learner_ratio) && (
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure & Physical Resources</CardTitle>
            <CardDescription>
              Training facility and resource information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(readiness as any).training_site_address && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Training Site Address</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {(readiness as any).training_site_address}
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {(readiness as any).ownership_type && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Ownership Type</span>
                    <p className="text-lg">{(readiness as any).ownership_type}</p>
                  </div>
                )}
                {(readiness as any).number_of_training_rooms && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Number of Training Rooms</span>
                    <p className="text-lg">{(readiness as any).number_of_training_rooms}</p>
                  </div>
                )}
                {(readiness as any).room_capacity && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Room Capacity</span>
                    <p className="text-lg">{(readiness as any).room_capacity} learners per room</p>
                  </div>
                )}
                {(readiness as any).facilitator_learner_ratio && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Facilitator : Learner Ratio</span>
                    <p className="text-lg">{(readiness as any).facilitator_learner_ratio}</p>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Documents:</strong> Proof of Ownership/Lease, Furniture & Equipment Checklist, Inventory Upload</p>
                <p className="mt-1">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Material Alignment Section Display */}
      {((readiness as any).learning_material_exists !== null || 
        (readiness as any).knowledge_module_coverage || 
        (readiness as any).practical_module_coverage ||
        (readiness as any).curriculum_alignment_confirmed !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Material Alignment</CardTitle>
            <CardDescription>
              Learning material coverage and curriculum alignment information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(readiness as any).learning_material_exists !== null && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Learning Material Exists</span>
                  <p className="text-lg">
                    {(readiness as any).learning_material_exists ? (
                      <span className="text-green-600 font-medium">Yes ✓</span>
                    ) : (
                      <span className="text-red-600 font-medium">No ✗</span>
                    )}
                  </p>
                </div>
              )}
              {((readiness as any).knowledge_module_coverage || (readiness as any).practical_module_coverage) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {(readiness as any).knowledge_module_coverage !== null && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Knowledge Module Coverage</span>
                      <p className="text-lg">{(readiness as any).knowledge_module_coverage}%</p>
                    </div>
                  )}
                  {(readiness as any).practical_module_coverage !== null && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Practical Module Coverage</span>
                      <p className="text-lg">{(readiness as any).practical_module_coverage}%</p>
                    </div>
                  )}
                </div>
              )}
              {(readiness as any).curriculum_alignment_confirmed !== null && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Curriculum Alignment Confirmed</span>
                  <p className="text-lg">
                    {(readiness as any).curriculum_alignment_confirmed ? (
                      <span className="text-green-600 font-medium">Yes ✓</span>
                    ) : (
                      <span className="text-red-600 font-medium">No ✗</span>
                    )}
                  </p>
                </div>
              )}
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Documents:</strong> Sample Learning Material Upload (≥50% coverage required)</p>
                <p className="mt-1">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Occupational Health & Safety (OHS) Section Display */}
      {((readiness as any).fire_extinguisher_available !== null || 
        (readiness as any).fire_extinguisher_service_date ||
        (readiness as any).emergency_exits_marked !== null ||
        (readiness as any).accessibility_for_disabilities !== null ||
        (readiness as any).first_aid_kit_available !== null ||
        (readiness as any).ohs_representative_name) && (
        <Card>
          <CardHeader>
            <CardTitle>Occupational Health & Safety (OHS)</CardTitle>
            <CardDescription>
              OHS compliance and safety information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {(readiness as any).fire_extinguisher_available !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Fire Extinguisher Available</span>
                    <p className="text-lg">
                      {(readiness as any).fire_extinguisher_available ? (
                        <span className="text-green-600 font-medium">Yes ✓</span>
                      ) : (
                        <span className="text-red-600 font-medium">No ✗</span>
                      )}
                    </p>
                    {(readiness as any).fire_extinguisher_service_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Service Date: {formatDate(new Date((readiness as any).fire_extinguisher_service_date))}
                      </p>
                    )}
                  </div>
                )}
                {(readiness as any).emergency_exits_marked !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Emergency Exits Marked</span>
                    <p className="text-lg">
                      {(readiness as any).emergency_exits_marked ? (
                        <span className="text-green-600 font-medium">Yes ✓</span>
                      ) : (
                        <span className="text-red-600 font-medium">No ✗</span>
                      )}
                    </p>
                  </div>
                )}
                {(readiness as any).accessibility_for_disabilities !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Accessibility for Disabilities</span>
                    <p className="text-lg">
                      {(readiness as any).accessibility_for_disabilities ? (
                        <span className="text-green-600 font-medium">Yes ✓</span>
                      ) : (
                        <span className="text-red-600 font-medium">No ✗</span>
                      )}
                    </p>
                  </div>
                )}
                {(readiness as any).first_aid_kit_available !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">First Aid Kit Available</span>
                    <p className="text-lg">
                      {(readiness as any).first_aid_kit_available ? (
                        <span className="text-green-600 font-medium">Yes ✓</span>
                      ) : (
                        <span className="text-red-600 font-medium">No ✗</span>
                      )}
                    </p>
                  </div>
                )}
                {(readiness as any).ohs_representative_name && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">OHS Representative</span>
                    <p className="text-lg">{(readiness as any).ohs_representative_name}</p>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Documents:</strong> Evacuation Plan, OHS Audit Report, OHS Appointment Letter</p>
                <p className="mt-1">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LMS & Online Delivery Capability Section Display */}
      {(readiness.delivery_mode === "BLENDED" || readiness.delivery_mode === "MOBILE" || (readiness as any).lms_name) && (
        <Card>
          <CardHeader>
            <CardTitle>LMS & Online Delivery Capability</CardTitle>
            <CardDescription>
              Learning Management System and online delivery infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                <p>ℹ️ <strong>Note:</strong> This section is required for Blended or Mobile delivery modes.</p>
              </div>

              {(readiness as any).lms_name && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">LMS Name</span>
                  <p className="text-lg">{(readiness as any).lms_name}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {(readiness as any).max_learner_capacity && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Max Learner Capacity</span>
                    <p className="text-lg">{(readiness as any).max_learner_capacity} learners</p>
                  </div>
                )}
                {(readiness as any).internet_connectivity_method && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Internet Connectivity Method</span>
                    <p className="text-lg">{(readiness as any).internet_connectivity_method}</p>
                  </div>
                )}
                {(readiness as any).isp && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">ISP</span>
                    <p className="text-lg">{(readiness as any).isp}</p>
                  </div>
                )}
                {(readiness as any).backup_frequency && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Backup Frequency</span>
                    <p className="text-lg">{(readiness as any).backup_frequency}</p>
                  </div>
                )}
              </div>

              {(readiness as any).data_storage_description && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Data Storage Description</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {(readiness as any).data_storage_description}
                  </p>
                </div>
              )}

              {(readiness as any).security_measures_description && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Security Measures Description</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {(readiness as any).security_measures_description}
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Documents:</strong> LMS Licence Proof Upload</p>
                <p className="mt-1">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workplace-Based Learning (WBL) Section Display */}
      {((readiness as any).wbl_workplace_partner_name || 
        (readiness as any).wbl_agreement_type || 
        (readiness as any).wbl_agreement_duration ||
        (readiness as any).wbl_components_covered ||
        (readiness as any).wbl_learner_support_description ||
        (readiness as any).wbl_assessment_responsibility) && (
        <Card>
          <CardHeader>
            <CardTitle>Workplace-Based Learning (WBL)</CardTitle>
            <CardDescription>
              Workplace learning partnership and agreement information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {(readiness as any).wbl_workplace_partner_name && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Workplace Partner Name</span>
                    <p className="text-lg">{(readiness as any).wbl_workplace_partner_name}</p>
                  </div>
                )}
                {(readiness as any).wbl_agreement_type && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Agreement Type</span>
                    <p className="text-lg">{(readiness as any).wbl_agreement_type}</p>
                  </div>
                )}
                {(readiness as any).wbl_agreement_duration && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Agreement Duration</span>
                    <p className="text-lg">{(readiness as any).wbl_agreement_duration}</p>
                  </div>
                )}
                {(readiness as any).wbl_assessment_responsibility && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Assessment Responsibility</span>
                    <p className="text-lg">{(readiness as any).wbl_assessment_responsibility}</p>
                  </div>
                )}
              </div>

              {(readiness as any).wbl_components_covered && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">WBL Components Covered</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {(readiness as any).wbl_components_covered}
                  </p>
                </div>
              )}

              {(readiness as any).wbl_learner_support_description && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Learner Support Description</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {(readiness as any).wbl_learner_support_description}
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Documents:</strong> WBL Agreement, Logbook Template, Monitoring Schedule</p>
                <p className="mt-1">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies & Procedures Section Display */}
      {(readiness as any).policies_procedures_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Policies & Procedures</CardTitle>
            <CardDescription>
              Policy documentation and procedures information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                <p>ℹ️ <strong>Note:</strong> Full policy management with policy list and dates will be available in a future update.</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Policies & Procedures Notes</span>
                <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                  {(readiness as any).policies_procedures_notes}
                </p>
              </div>
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Policies:</strong> Finance, HR, Teaching & Learning, Assessment, Appeals, OHS, Refunds</p>
                <p className="mt-1">Check the Documents section above for uploaded policy documents.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Human Resources (Facilitators) Section Display */}
      {(readiness as any).facilitators_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Human Resources (Facilitators)</CardTitle>
            <CardDescription>
              Facilitator information and qualifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                <p>ℹ️ <strong>Note:</strong> Full facilitator management with facilitator table, CVs, and contracts will be available in a future update.</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Facilitators Information</span>
                <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                  {(readiness as any).facilitators_notes}
                </p>
              </div>
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p>📄 <strong>Required Documents per Facilitator:</strong> CV, Contract/SLA, SAQA Evaluation (if applicable), Work Permit (if applicable)</p>
                <p className="mt-1">Check the Documents section above for uploaded facilitator documents.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Summary */}
      {canEdit && (
        <ReadinessCompletionSummary readiness={readiness} />
      )}

      {/* Edit Form */}
      {canEdit && (
        <ReadinessEditForm readiness={readiness} />
      )}

      {/* QCTO Recommendation */}
      {readiness.recommendation && (
        <Card>
          <CardHeader>
            <CardTitle>QCTO Recommendation</CardTitle>
            <CardDescription>
              Recommendation from QCTO review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Recommendation</span>
                <p className="text-lg font-medium">{readiness.recommendation.recommendation}</p>
              </div>
              {readiness.recommendation.remarks && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Remarks</span>
                  <p className="text-sm whitespace-pre-wrap">{readiness.recommendation.remarks}</p>
                </div>
              )}
              {readiness.recommendation.recommendedByUser && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Reviewed By</span>
                  <p className="text-sm">
                    {readiness.recommendation.recommendedByUser.first_name} {readiness.recommendation.recommendedByUser.last_name}
                    <br />
                    <span className="text-muted-foreground">{readiness.recommendation.recommendedByUser.email}</span>
                  </p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Review Date</span>
                <p className="text-sm text-muted-foreground">{formatDate(readiness.recommendation.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {readiness.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Evidence and supporting documents for this readiness record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {readiness.documents.map((doc) => (
                <div key={doc.document_id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_type} • {formatDate(doc.uploaded_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cannot Edit Message */}
      {!canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Readiness Record Locked</CardTitle>
            <CardDescription>
              This readiness record cannot be edited in its current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Status: <Badge variant={getStatusVariant(readiness.readiness_status)}>{formatStatus(readiness.readiness_status)}</Badge>
              <br />
              Institution users can only edit readiness records with status NOT_STARTED or IN_PROGRESS.
              {readiness.readiness_status === "RETURNED_FOR_CORRECTION" && (
                <>
                  <br />
                  <br />
                  <strong>This record has been returned for correction.</strong> Please review QCTO remarks above and make necessary changes.
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
