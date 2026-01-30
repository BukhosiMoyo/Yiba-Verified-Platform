import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReadForQCTO } from "@/lib/api/qctoAccess";
import type { ApiContext } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Building2, FileText, User, GraduationCap, Award, FileCheck, AlertCircle, Shield, CheckCircle, XCircle, Clock, Users as UsersIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FacilitatorVerificationForm } from "@/components/qcto/FacilitatorVerificationForm";

interface PageProps {
  params: Promise<{ facilitatorId: string }>;
}

/**
 * QCTO Facilitator Details Page
 *
 * View facilitator linked to a readiness record (from APPROVED submissions/requests).
 * - QCTO_USER: can view if facilitator is in a submission/request QCTO can access
 * - PLATFORM_ADMIN: can view any facilitator
 */
export default async function QCTOFacilitatorDetailPage({ params }: PageProps) {
  const { facilitatorId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!canAccessQctoData(role)) redirect("/unauthorized");

  const ctx: ApiContext = {
    userId: (session.user as { userId?: string }).userId ?? (session.user as { id?: string }).id ?? "",
    role: role!,
    institutionId: (session.user as { institutionId?: string }).institutionId ?? null,
    qctoId: (session.user as { qctoId?: string | null }).qctoId ?? null,
  };

  const canRead = await canReadForQCTO(ctx, "FACILITATOR", facilitatorId);
  if (!canRead) notFound();

  const facilitator = await prisma.facilitator.findUnique({
    where: { facilitator_id: facilitatorId },
    include: {
      readiness: {
        select: {
          readiness_id: true,
          qualification_title: true,
          saqa_id: true,
          nqf_level: true,
          readiness_status: true,
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
              registration_number: true,
              province: true,
            },
          },
        },
      },
      documents: {
        include: {
          documentFlags: {
            where: { status: "FLAGGED" },
            include: {
              flaggedBy: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { uploaded_at: "desc" },
      },
      certifications: {
        include: {
          document: {
            select: {
              document_id: true,
              file_name: true,
              document_type: true,
            },
          },
        },
        orderBy: [
          { expiry_date: "asc" },
          { certification_name: "asc" },
        ],
      },
      user: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          facilitator_profile_complete: true,
        },
      },
      moduleCompletions: {
        include: {
          enrolment: {
            include: {
              learner: {
                select: {
                  learner_id: true,
                  first_name: true,
                  last_name: true,
                  national_id: true,
                },
              },
              qualification: {
                select: {
                  qualification_id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        take: 50,
        orderBy: { completion_date: "desc" },
      },
      verifiedByUser: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  if (!facilitator) notFound();

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

  const inst = facilitator.readiness.institution;
  const readiness = facilitator.readiness;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link
        href="/qcto/facilitators"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to facilitators
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {facilitator.first_name} {facilitator.last_name}
        </h1>
        <p className="text-gray-600 mt-1">Facilitator details and qualifications</p>
        {facilitator.user_id && facilitator.user && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800">
            <User className="h-4 w-4 text-emerald-600" />
            <span>Linked to platform user profile</span>
            <Badge variant="secondary" className="text-xs">
              {facilitator.user.email}
            </Badge>
            {facilitator.user.facilitator_profile_complete && (
              <Badge variant="default" className="bg-emerald-600 text-xs">
                Profile complete
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Basic Information */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</p>
              <p className="mt-0.5 text-[15px] text-gray-900">
                {facilitator.first_name} {facilitator.last_name}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">ID Number / Passport</p>
              <p className="mt-0.5 text-[15px] text-gray-900 font-mono">{facilitator.id_number || "—"}</p>
            </div>
            {facilitator.is_non_sa && (
              <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">SAQA Evaluation ID</p>
                  <p className="mt-0.5 text-[15px] text-gray-900">{facilitator.saqa_evaluation_id || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Work Permit Number</p>
                  <p className="mt-0.5 text-[15px] text-gray-900">{facilitator.work_permit_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Visa / Passport Number</p>
                  <p className="mt-0.5 text-[15px] text-gray-900">{facilitator.visa_passport_number || "—"}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Qualifications & Experience */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-gray-500" />
            Qualifications & Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {facilitator.qualifications && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Qualifications</p>
              <p className="mt-0.5 text-[15px] text-gray-900 whitespace-pre-wrap">{facilitator.qualifications}</p>
            </div>
          )}
          {facilitator.industry_experience && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Industry Experience</p>
              <p className="mt-0.5 text-[15px] text-gray-900 whitespace-pre-wrap">{facilitator.industry_experience}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Institution & Readiness Record */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Institution & Qualification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Institution</p>
              <p className="mt-0.5 flex items-center gap-2 text-[15px] text-gray-900">
                <Building2 className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                {inst?.trading_name || inst?.legal_name || "—"}
                {inst?.registration_number && (
                  <span className="text-xs text-muted-foreground ml-1">({inst.registration_number})</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Province</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{inst?.province || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Qualification</p>
              <p className="mt-0.5 flex items-center gap-2 text-[15px] text-gray-900">
                <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                {readiness.qualification_title || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">SAQA ID</p>
              <p className="mt-0.5 text-[15px] text-gray-900 font-mono">{readiness.saqa_id || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">NQF Level</p>
              <p className="mt-0.5 text-[15px] text-gray-900">NQF {readiness.nqf_level || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Readiness Status</p>
              <p className="mt-0.5">
                <Badge className="bg-blue-100 text-blue-800">{readiness.readiness_status || "—"}</Badge>
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/qcto/readiness/${readiness.readiness_id}`}>
                View Readiness Record
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-500" />
                Verification Status
              </CardTitle>
            </div>
            <FacilitatorVerificationForm
              facilitatorId={facilitatorId}
              currentStatus={facilitator.verification_status || undefined}
              onSuccess={() => {
                window.location.reload();
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {facilitator.verification_status === "VERIFIED" && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </Badge>
              )}
              {facilitator.verification_status === "PENDING" && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="h-4 w-4 mr-1" />
                  Pending Verification
                </Badge>
              )}
              {facilitator.verification_status === "REJECTED" && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejected
                </Badge>
              )}
              {!facilitator.verification_status && (
                <Badge className="bg-gray-100 text-gray-800">Not Verified</Badge>
              )}
            </div>
            {facilitator.verified_at && (
              <div className="text-sm text-muted-foreground">
                <p>Verified: {formatDate(facilitator.verified_at)}</p>
                {facilitator.verifiedByUser && (
                  <p className="text-xs mt-0.5">By: {[facilitator.verifiedByUser.first_name, facilitator.verifiedByUser.last_name].filter(Boolean).join(" ").trim() || facilitator.verifiedByUser.email}</p>
                )}
              </div>
            )}
          </div>
          {facilitator.verification_notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Verification Notes</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{facilitator.verification_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-500" />
            Certifications & Licenses
          </CardTitle>
          <CardDescription>
            {facilitator.certifications.length} certification{facilitator.certifications.length !== 1 ? "s" : ""} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facilitator.certifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certifications recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {facilitator.certifications.map((cert: any) => {
                const now = new Date();
                const expiryDate = cert.expiry_date ? new Date(cert.expiry_date) : null;
                const isExpired = expiryDate && expiryDate <= now;
                const isExpiringSoon = expiryDate && expiryDate > now && expiryDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <div
                    key={cert.certification_id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isExpired
                        ? "border-red-200 bg-red-50/50"
                        : isExpiringSoon
                        ? "border-orange-200 bg-orange-50/50"
                        : cert.verified
                        ? "border-green-200 bg-green-50/50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{cert.certification_name}</p>
                        {cert.verified && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        {cert.certification_type && (
                          <p className="text-xs text-muted-foreground">Type: {cert.certification_type}</p>
                        )}
                        {cert.issuing_authority && (
                          <p className="text-xs text-muted-foreground">Issued by: {cert.issuing_authority}</p>
                        )}
                        {cert.certificate_number && (
                          <p className="text-xs text-muted-foreground font-mono">Cert #: {cert.certificate_number}</p>
                        )}
                        {cert.issue_date && (
                          <p className="text-xs text-muted-foreground">Issued: {formatDate(cert.issue_date)}</p>
                        )}
                        {expiryDate && (
                          <p className={`text-xs ${isExpired ? "text-red-600 font-semibold" : isExpiringSoon ? "text-orange-600 font-semibold" : "text-muted-foreground"}`}>
                            {isExpired ? "⚠️ EXPIRED: " : isExpiringSoon ? "⚠️ Expires: " : "Expires: "}
                            {formatDate(expiryDate)}
                          </p>
                        )}
                        {!expiryDate && (
                          <p className="text-xs text-muted-foreground">No expiry date</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {facilitator.moduleCompletions && facilitator.moduleCompletions.length > 0 && (
        <Card className="border border-gray-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Teaching and assessment performance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total Modules Assessed
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {facilitator.moduleCompletions.length}
                </p>
                <p className="text-xs text-muted-foreground">Module completions</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Unique Learners
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const uniqueLearners = new Set(
                      facilitator.moduleCompletions
                        .map((mc: any) => mc.enrolment?.learner?.learner_id)
                        .filter((id: any) => id)
                    );
                    return uniqueLearners.size;
                  })()}
                </p>
                <p className="text-xs text-muted-foreground">Learners taught</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const completed = facilitator.moduleCompletions.filter(
                      (mc: any) => mc.status === "COMPLETED"
                    ).length;
                    const total = facilitator.moduleCompletions.length;
                    return total > 0 ? `${Math.round((completed / total) * 100)}%` : "—";
                  })()}
                </p>
                <p className="text-xs text-muted-foreground">Modules completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learners Taught */}
      {facilitator.moduleCompletions && facilitator.moduleCompletions.length > 0 && (
        <Card className="border border-gray-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-gray-500" />
              Learners Taught
            </CardTitle>
            <CardDescription>
              {facilitator.moduleCompletions.length} module completion{facilitator.moduleCompletions.length !== 1 ? "s" : ""} assessed by this facilitator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facilitator.moduleCompletions.slice(0, 10).map((mc: any) => (
                <div key={mc.completion_id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {mc.enrolment?.learner?.first_name} {mc.enrolment?.learner?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mc.enrolment?.qualification?.name || mc.enrolment?.qualification_title || "—"}
                      {mc.module_name && ` · ${mc.module_name}`}
                    </p>
                    {mc.completion_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed: {formatDate(mc.completion_date)}
                      </p>
                    )}
                  </div>
                  <Link href={`/qcto/enrolments/${mc.enrolment_id}`}>
                    <Button variant="outline" size="sm">View Enrolment</Button>
                  </Link>
                </div>
              ))}
              {facilitator.moduleCompletions.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing 10 of {facilitator.moduleCompletions.length} module completions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Documents
          </CardTitle>
          <CardDescription>
            {facilitator.documents.length} document{facilitator.documents.length !== 1 ? "s" : ""} linked to this facilitator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {facilitator.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents linked to this facilitator yet.</p>
          ) : (
            <div className="space-y-3">
              {facilitator.documents.map((doc) => {
                const hasFlags = doc.documentFlags && doc.documentFlags.length > 0;
                return (
                  <div
                    key={doc.document_id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      hasFlags
                        ? "border-orange-200 bg-orange-50/50"
                        : doc.status === "ACCEPTED"
                        ? "border-green-200 bg-green-50/50"
                        : "border-gray-200 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                        {hasFlags && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            <span className="text-xs text-orange-600">
                              {doc.documentFlags.length} flag{doc.documentFlags.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.status === "ACCEPTED" && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                      )}
                      {doc.status === "FLAGGED" && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">Flagged</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
