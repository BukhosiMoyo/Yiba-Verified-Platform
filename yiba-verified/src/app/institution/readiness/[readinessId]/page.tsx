import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReadinessFormFullPage } from "@/components/institution/ReadinessFormFullPage";
import {
  FileCheck,
  ArrowLeft,
  GraduationCap,
  Hash,
  Layers,
  BookOpen,
  Smartphone,
  FileText,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Shield,
  Monitor,
  Briefcase,
  FileSignature,
  Users,
  MessageSquare,
  Lock,
  MapPin,
  Info,
  HelpCircle,
} from "lucide-react";

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
          document_type: true,
          mime_type: true,
          file_size_bytes: true,
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

  // Format status label
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  // Status-based accent (left border, badge)
  const getStatusAccent = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return { border: "border-l-slate-400", badge: "bg-slate-100 text-slate-700 border-slate-200" };
      case "IN_PROGRESS":
        return { border: "border-l-amber-500", badge: "bg-amber-500/12 text-amber-700 border-amber-200/60" };
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return { border: "border-l-blue-500", badge: "bg-blue-500/12 text-blue-700 border-blue-200/60" };
      case "RECOMMENDED":
      case "REVIEWED":
        return { border: "border-l-emerald-500", badge: "bg-emerald-500/12 text-emerald-700 border-emerald-200/60" };
      case "REJECTED":
      case "RETURNED_FOR_CORRECTION":
        return { border: "border-l-rose-500", badge: "bg-rose-500/12 text-rose-700 border-rose-200/60" };
      default:
        return { border: "border-l-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200" };
    }
  };

  const getDeliveryBadge = (mode: string) => {
    const m: Record<string, string> = {
      FACE_TO_FACE: "bg-violet-500/12 text-violet-700 border-violet-200/60",
      BLENDED: "bg-cyan-500/12 text-cyan-700 border-cyan-200/60",
      MOBILE: "bg-teal-500/12 text-teal-700 border-teal-200/60",
    };
    return m[mode] || "bg-slate-100 text-slate-600 border-slate-200";
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

  const statusAccent = getStatusAccent(readiness.readiness_status);

  if (canEdit) {
    return <ReadinessFormFullPage readiness={readiness} />;
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-8 md:px-8 md:py-10 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <FileCheck className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Form 5 Readiness</h1>
              <p className="mt-1 text-indigo-100 text-sm md:text-base">
                {readiness.qualification_title}
              </p>
              <span className="inline-flex items-center gap-1.5 mt-2 rounded-lg border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                {formatStatus(readiness.readiness_status)}
              </span>
            </div>
          </div>
          <Link href="/institution/readiness">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-white border border-white/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Readiness Records
            </Button>
          </Link>
        </div>
      </div>

      {/* Readiness Details */}
      <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden border-l-4 ${statusAccent.border}`}>
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-indigo-50/60 to-white px-6 py-4 md:px-8 md:py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <GraduationCap className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Readiness Details</h2>
                <p className="text-sm text-slate-600">Form 5 readiness record for qualification delivery</p>
              </div>
            </div>
            <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusAccent.badge}`}>
              {formatStatus(readiness.readiness_status)}
            </span>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <GraduationCap className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Qualification Title</span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">{readiness.qualification_title}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <Hash className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">SAQA ID</span>
                <p className="text-base font-mono font-semibold text-slate-900 mt-0.5">{readiness.saqa_id}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <Layers className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">NQF Level</span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">{readiness.nqf_level || "—"}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Curriculum Code</span>
                <p className="text-base font-mono font-semibold text-slate-900 mt-0.5">{readiness.curriculum_code}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <Smartphone className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Delivery Mode</span>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${getDeliveryBadge(readiness.delivery_mode)}`}>
                    {readiness.delivery_mode.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <FileText className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Documents</span>
                <p className="text-base font-semibold text-slate-900 mt-0.5">{readiness._count.documents} uploaded</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <Calendar className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Created</span>
                <p className="text-sm text-slate-700 mt-0.5">{formatDate(readiness.created_at)}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
              <Calendar className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</span>
                <p className="text-sm text-slate-700 mt-0.5">{formatDate(readiness.updated_at)}</p>
              </div>
            </div>
            {readiness.submission_date && (
              <div className="flex gap-3 rounded-xl bg-emerald-50/80 p-4 md:col-span-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Submitted</span>
                  <p className="text-sm text-slate-700 mt-0.5">{formatDate(readiness.submission_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Self-Assessment Section Display */}
      {(readiness.self_assessment_completed !== null || readiness.self_assessment_remarks) && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-emerald-50/60 to-white px-6 py-4 md:px-8 md:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Self-Assessment</h2>
                <p className="text-sm text-slate-600">Self-assessment information for this readiness record</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                <ClipboardCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Self-Assessment Completed</span>
                  <p className="mt-1 flex items-center gap-2">
                    {readiness.self_assessment_completed === null ? (
                      <span className="text-slate-500 italic">Not answered</span>
                    ) : readiness.self_assessment_completed ? (
                      <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-rose-700 font-semibold">
                        <XCircle className="h-5 w-5 text-rose-600" /> No
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {readiness.self_assessment_remarks && (
                <div className="flex gap-3 rounded-xl bg-emerald-50/40 p-4">
                  <FileText className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-emerald-800/80 uppercase tracking-wider">Remarks / Narrative</span>
                    <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700">{readiness.self_assessment_remarks}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration & Legal Compliance Section Display */}
      {((readiness as any).registration_type || (readiness as any).professional_body_registration !== null) && (
        <Card className="overflow-hidden border-l-4 border-l-violet-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle>Registration & Legal Compliance</CardTitle>
                <CardDescription>Registration and legal compliance information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(readiness as any).registration_type && (
                <div className="flex gap-3 rounded-xl bg-violet-50/50 p-4">
                  <Shield className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Registration Type</span>
                    <p className="text-base font-semibold text-slate-900 mt-0.5">{(readiness as any).registration_type}</p>
                  </div>
                </div>
              )}
              {(readiness as any).professional_body_registration !== null && (
                <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                  <HelpCircle className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Professional Body Registration</span>
                    <p className="mt-1">
                      {(readiness as any).professional_body_registration ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold">
                          <XCircle className="h-5 w-5 text-rose-600" /> No
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 rounded-lg border border-blue-200/60 bg-blue-50/50 p-3">
                <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p><strong>Required Documents:</strong> Registration Proof, Tax Compliance PIN, Professional Body Registration (if applicable)</p>
                  <p className="mt-1 text-blue-800">Check the Documents section for uploaded files.</p>
                </div>
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
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Infrastructure & Physical Resources</CardTitle>
                <CardDescription>Training facility and resource information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(readiness as any).training_site_address && (
                <div className="flex gap-3 rounded-xl bg-amber-50/50 p-4">
                  <MapPin className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Training Site Address</span>
                    <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700">{(readiness as any).training_site_address}</p>
                  </div>
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
              <div className="text-sm rounded-lg border border-blue-200/60 bg-blue-50/50 p-3 mt-2 text-blue-900">
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-600" aria-hidden /><strong>Required Documents:</strong> Proof of Ownership/Lease, Furniture & Equipment Checklist, Inventory Upload</p>
                <p className="mt-1 text-blue-800">Check the Documents section above for uploaded files.</p>
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
        <Card className="overflow-hidden border-l-4 border-l-sky-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                <BookOpen className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <CardTitle>Learning Material Alignment</CardTitle>
                <CardDescription>Learning material coverage and curriculum alignment information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(readiness as any).learning_material_exists !== null && (
                <div className="flex gap-3 rounded-xl bg-sky-50/50 p-4">
                  <BookOpen className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Learning Material Exists</span>
                    <p className="mt-1">
                      {(readiness as any).learning_material_exists ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold">
                          <XCircle className="h-5 w-5 text-rose-600" /> No
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {((readiness as any).knowledge_module_coverage != null || (readiness as any).practical_module_coverage != null) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {(readiness as any).knowledge_module_coverage != null && (
                    <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                      <Layers className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Knowledge Module Coverage</span>
                        <p className="text-base font-semibold text-slate-900 mt-0.5">{(readiness as any).knowledge_module_coverage}%</p>
                      </div>
                    </div>
                  )}
                  {(readiness as any).practical_module_coverage != null && (
                    <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                      <Layers className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Practical Module Coverage</span>
                        <p className="text-base font-semibold text-slate-900 mt-0.5">{(readiness as any).practical_module_coverage}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {(readiness as any).curriculum_alignment_confirmed !== null && (
                <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                  <CheckCircle2 className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Curriculum Alignment Confirmed</span>
                    <p className="mt-1">
                      {(readiness as any).curriculum_alignment_confirmed ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold">
                          <XCircle className="h-5 w-5 text-rose-600" /> No
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 rounded-lg border border-blue-200/60 bg-blue-50/50 p-3">
                <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p><strong>Required Documents:</strong> Sample Learning Material Upload (≥50% coverage required)</p>
                  <p className="mt-1 text-blue-800">Check the Documents section for uploaded files.</p>
                </div>
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
        <Card className="overflow-hidden border-l-4 border-l-rose-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                <Shield className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <CardTitle>Occupational Health & Safety (OHS)</CardTitle>
                <CardDescription>OHS compliance and safety information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {(readiness as any).fire_extinguisher_available !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Fire Extinguisher Available</span>
                    <p className="text-lg">
                      {(readiness as any).fire_extinguisher_available ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold"><XCircle className="h-5 w-5 text-rose-600" /> No</span>
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
                        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold"><XCircle className="h-5 w-5 text-rose-600" /> No</span>
                      )}
                    </p>
                  </div>
                )}
                {(readiness as any).accessibility_for_disabilities !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Accessibility for Disabilities</span>
                    <p className="text-lg">
                      {(readiness as any).accessibility_for_disabilities ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold"><XCircle className="h-5 w-5 text-rose-600" /> No</span>
                      )}
                    </p>
                  </div>
                )}
                {(readiness as any).first_aid_kit_available !== null && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">First Aid Kit Available</span>
                    <p className="text-lg">
                      {(readiness as any).first_aid_kit_available ? (
                        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-rose-700 font-semibold"><XCircle className="h-5 w-5 text-rose-600" /> No</span>
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
              <div className="text-sm rounded-lg border border-blue-200/60 bg-blue-50/50 p-3 mt-2 text-blue-900">
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-600" aria-hidden /><strong>Required Documents:</strong> Evacuation Plan, OHS Audit Report, OHS Appointment Letter</p>
                <p className="mt-1 text-blue-800">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LMS & Online Delivery Capability Section Display */}
      {(readiness.delivery_mode === "BLENDED" || readiness.delivery_mode === "MOBILE" || (readiness as any).lms_name) && (
        <Card className="overflow-hidden border-l-4 border-l-cyan-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <Monitor className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <CardTitle>LMS & Online Delivery Capability</CardTitle>
                <CardDescription>Learning Management System and online delivery infrastructure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg bg-amber-50/60 border border-amber-200/60 p-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700"><strong>Note:</strong> This section is required for Blended or Mobile delivery modes.</p>
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

              <div className="text-sm rounded-lg border border-blue-200/60 bg-blue-50/50 p-3 mt-2 text-blue-900">
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-600" aria-hidden /><strong>Required Documents:</strong> LMS Licence Proof Upload</p>
                <p className="mt-1 text-blue-800">Check the Documents section above for uploaded files.</p>
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
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Briefcase className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle>Workplace-Based Learning (WBL)</CardTitle>
                <CardDescription>Workplace learning partnership and agreement information</CardDescription>
              </div>
            </div>
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

              <div className="text-sm rounded-lg border border-blue-200/60 bg-blue-50/50 p-3 mt-2 text-blue-900">
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-600" aria-hidden /><strong>Required Documents:</strong> WBL Agreement, Logbook Template, Monitoring Schedule</p>
                <p className="mt-1 text-blue-800">Check the Documents section above for uploaded files.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies & Procedures Section Display */}
      {(readiness as any).policies_procedures_notes && (
        <Card className="overflow-hidden border-l-4 border-l-slate-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/10">
                <FileSignature className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle>Policies & Procedures</CardTitle>
                <CardDescription>Policy documentation and procedures information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-blue-200/60 bg-blue-50/50 p-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900"><strong>Note:</strong> Full policy management with policy list and dates will be available in a future update.</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Policies & Procedures Notes</span>
                <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                  {(readiness as any).policies_procedures_notes}
                </p>
              </div>
              <div className="text-sm text-muted-foreground pt-2 border-t">
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-gray-600" aria-hidden /><strong>Required Policies:</strong> Finance, HR, Teaching & Learning, Assessment, Appeals, OHS, Refunds</p>
                <p className="mt-1">Check the Documents section above for uploaded policy documents.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Human Resources (Facilitators) Section Display */}
      {(readiness as any).facilitators_notes && (
        <Card className="overflow-hidden border-l-4 border-l-indigo-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Human Resources (Facilitators)</CardTitle>
                <CardDescription>Facilitator information and qualifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-blue-200/60 bg-blue-50/50 p-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900"><strong>Note:</strong> Full facilitator management with facilitator table, CVs, and contracts will be available in a future update.</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Facilitators Information</span>
                <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                  {(readiness as any).facilitators_notes}
                </p>
              </div>
              <div className="text-sm rounded-lg border border-blue-200/60 bg-blue-50/50 p-3 mt-2 text-blue-900">
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-600" aria-hidden /><strong>Required Documents per Facilitator:</strong> CV, Contract/SLA, SAQA Evaluation (if applicable), Work Permit (if applicable)</p>
                <p className="mt-1 text-blue-800">Check the Documents section above for uploaded facilitator documents.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QCTO Recommendation */}
      {readiness.recommendation && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-emerald-50/60 to-white px-6 py-4 md:px-8 md:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">QCTO Recommendation</h2>
                <p className="text-sm text-slate-600">Recommendation from QCTO review</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl bg-emerald-50/50 p-4">
                <MessageSquare className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recommendation</span>
                  <p className="text-base font-semibold text-slate-900 mt-0.5">{readiness.recommendation.recommendation}</p>
                </div>
              </div>
              {readiness.recommendation.remarks && (
                <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                  <FileText className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Remarks</span>
                    <p className="text-sm whitespace-pre-wrap mt-1 text-slate-700">{readiness.recommendation.remarks}</p>
                  </div>
                </div>
              )}
              {readiness.recommendation.recommendedByUser && (
                <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                  <Users className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reviewed By</span>
                    <p className="text-sm font-medium text-slate-900 mt-0.5">
                      {readiness.recommendation.recommendedByUser.first_name} {readiness.recommendation.recommendedByUser.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{readiness.recommendation.recommendedByUser.email}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3 rounded-xl bg-slate-50/80 p-4">
                <Calendar className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Review Date</span>
                  <p className="text-sm text-slate-700 mt-0.5">{formatDate(readiness.recommendation.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents */}
      {readiness.documents.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden border-l-4 border-l-violet-500">
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-violet-50/60 to-white px-6 py-4 md:px-8 md:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
                <p className="text-sm text-slate-600">Evidence and supporting documents for this readiness record</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="space-y-3">
              {readiness.documents.map((doc) => (
                <div key={doc.document_id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:bg-violet-50/40 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <FileText className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{doc.file_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[doc.document_type || doc.mime_type || "—", doc.file_size_bytes != null ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB` : null, formatDate(doc.uploaded_at)].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cannot Edit Message */}
      {!canEdit && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 overflow-hidden border-l-4 border-l-amber-500">
          <div className="border-b border-amber-200/60 bg-amber-100/50 px-6 py-4 md:px-8 md:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <Lock className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Readiness Record Locked</h2>
                <p className="text-sm text-slate-600">This readiness record cannot be edited in its current status.</p>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700 space-y-2">
                <p>
                  Status: <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${getStatusAccent(readiness.readiness_status).badge}`}>{formatStatus(readiness.readiness_status)}</span>
                </p>
                <p>Institution users can only edit readiness records with status <strong>Not started</strong> or <strong>In progress</strong>.</p>
                {readiness.readiness_status === "RETURNED_FOR_CORRECTION" && (
                  <p className="pt-2 text-amber-800 font-medium">This record has been returned for correction. Please review QCTO remarks above and make necessary changes.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
