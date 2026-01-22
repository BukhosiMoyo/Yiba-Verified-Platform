import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubmissionReviewForm } from "@/components/qcto/SubmissionReviewForm";
import {
  ArrowLeft,
  FileText,
  Info,
  Link2,
  ClipboardCheck,
  Building2,
  User,
  Calendar,
  FileStack,
  Eye,
} from "lucide-react";

interface PageProps {
  params: Promise<{ submissionId: string }>;
}

/**
 * QCTO Submission Details Page
 * 
 * Server Component that displays submission details.
 * - Fetches submission from DB directly (read-only)
 * - QCTO_USER: can view any submission (they're reviewers!)
 * - PLATFORM_ADMIN: can view any submission (app owners see everything! 🦸)
 * - Ignores soft-deleted submissions
 */
export default async function QCTOSubmissionDetailsPage({ params }: PageProps) {
  const { submissionId } = await params;

  // Get session (layout already ensures auth, but we need role for access check)
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  if (!canAccessQctoData(userRole)) {
    redirect("/unauthorized");
  }

  // Fetch submission from database
  const submission = await prisma.submission.findUnique({
    where: { submission_id: submissionId },
    select: {
      submission_id: true,
      institution_id: true,
      title: true,
      submission_type: true,
      status: true,
      submitted_at: true,
      reviewed_at: true,
      review_notes: true,
      created_at: true,
      updated_at: true,
      deleted_at: true, // Include to check soft-delete
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
          institution_type: true,
          registration_number: true,
        },
      },
      submittedByUser: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      reviewedByUser: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      submissionResources: {
        select: {
          resource_id: true,
          resource_type: true,
          resource_id_value: true,
          added_at: true,
          notes: true,
          addedByUser: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          added_at: "desc",
        },
      },
      reviewAttachments: {
        select: {
          attachment_id: true,
          file_name: true,
          mime_type: true,
          file_size_bytes: true,
          uploaded_at: true,
        },
        orderBy: { uploaded_at: "desc" },
      },
    },
  });

  // Check if submission exists and is not soft-deleted
  if (!submission || submission.deleted_at !== null) {
    notFound();
  }

  // Format dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-800" },
      UNDER_REVIEW: { label: "Under Review", className: "bg-purple-100 text-purple-800" },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
      RETURNED_FOR_CORRECTION: { label: "Returned for Correction", className: "bg-orange-100 text-orange-800" },
    };
    return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  };

  const formatResourceType = (type: string) => {
    const typeMap: Record<string, string> = {
      READINESS: "Readiness Assessment",
      LEARNER: "Learner",
      ENROLMENT: "Enrolment",
      DOCUMENT: "Document",
      INSTITUTION: "Institution",
    };
    return typeMap[type] || type;
  };

  const statusInfo = formatStatus(submission.status);

  const labelClass = "text-xs font-semibold uppercase tracking-wide text-gray-500";
  const valueClass = "text-[15px] text-gray-900 mt-0.5";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/qcto/submissions"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to submissions
      </Link>

      {/* Hero: title, description, status — dots background */}
      <section className="qcto-metrics-pattern relative rounded-2xl border border-gray-200/70 bg-sky-50/60 px-6 py-5">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <FileText className="h-6 w-6" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
              <p className="text-gray-600 mt-1">
                View submission information and linked resources
              </p>
              <div className="mt-3">
                <Badge className={`${statusInfo.className} font-semibold`}>
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submission Information — subtle dots background, icon header */}
      <Card className="welcome-modal-pattern overflow-hidden border border-gray-200/60 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Info className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <CardTitle>Submission Information</CardTitle>
              <CardDescription>Institution, dates, and review metadata</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className={labelClass}>Institution</p>
              <p className={`${valueClass} flex items-center gap-2`}>
                <Building2 className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                {submission.institution.trading_name || submission.institution.legal_name}
                {submission.institution.registration_number && (
                  <span className="text-sm text-gray-500 font-normal">
                    ({submission.institution.registration_number})
                  </span>
                )}
              </p>
            </div>

            <div>
              <p className={labelClass}>Title</p>
              <p className={valueClass}>{submission.title || "Untitled"}</p>
            </div>

            <div>
              <p className={labelClass}>Submission Type</p>
              <p className={valueClass}>{submission.submission_type || "N/A"}</p>
            </div>

            <div>
              <p className={labelClass}>Submitted At</p>
              <p className={`${valueClass} flex items-center gap-2`}>
                <Calendar className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                {submission.submitted_at ? formatDateTime(submission.submitted_at) : "Not submitted"}
              </p>
            </div>

            {submission.submittedByUser && (
              <div>
                <p className={labelClass}>Submitted By</p>
                <p className={`${valueClass} flex items-center gap-2`}>
                  <User className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                  {[submission.submittedByUser.first_name, submission.submittedByUser.last_name].filter(Boolean).join(" ") || submission.submittedByUser.email}
                </p>
              </div>
            )}

            {submission.reviewed_at && (
              <div>
                <p className={labelClass}>Reviewed At</p>
                <p className={`${valueClass} flex items-center gap-2`}>
                  <Calendar className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                  {formatDateTime(submission.reviewed_at)}
                </p>
              </div>
            )}

            {submission.reviewedByUser && (
              <div>
                <p className={labelClass}>Reviewed By</p>
                <p className={`${valueClass} flex items-center gap-2`}>
                  <User className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                  {[submission.reviewedByUser.first_name, submission.reviewedByUser.last_name].filter(Boolean).join(" ") || submission.reviewedByUser.email}
                </p>
              </div>
            )}

            {submission.review_notes && (
              <div className="md:col-span-2">
                <p className={labelClass}>Review Notes</p>
                <p className={`${valueClass} whitespace-pre-wrap rounded-lg bg-amber-50/60 border border-amber-200/60 px-3 py-2 text-amber-900`}>
                  {submission.review_notes}
                </p>
              </div>
            )}

            {submission.reviewAttachments && submission.reviewAttachments.length > 0 && (
              <div className="md:col-span-2">
                <p className={labelClass}>Review attachments</p>
                <ul className="mt-1 space-y-1">
                  {submission.reviewAttachments.map((a) => (
                    <li key={a.attachment_id}>
                      <a
                        href={`/api/qcto/submissions/${submission.submission_id}/review-attachments/${a.attachment_id}/download`}
                        className="text-[15px] text-blue-600 hover:underline"
                      >
                        {a.file_name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className={labelClass}>Created</p>
              <p className={valueClass}>{formatDateTime(submission.created_at)}</p>
            </div>

            <div>
              <p className={labelClass}>Updated</p>
              <p className={valueClass}>{formatDateTime(submission.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Resources — subtle dots background; improved rows */}
      <Card className="welcome-modal-pattern overflow-hidden border border-gray-200/60 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Link2 className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <CardTitle>Linked Resources</CardTitle>
              <CardDescription>
                {submission.submissionResources.length} resource
                {submission.submissionResources.length !== 1 ? "s" : ""} linked to this submission
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {submission.submissionResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              <FileStack className="h-10 w-10 text-gray-300 mb-3" strokeWidth={1.5} aria-hidden />
              <p className="text-sm text-gray-500">No resources linked to this submission</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submission.submissionResources.map((resource) => (
                <div
                  key={resource.resource_id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200/60 bg-gray-50/95 backdrop-blur-sm p-4 shadow-sm transition-colors hover:bg-gray-100/90"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{formatResourceType(resource.resource_type)}</span>
                      <span className="text-sm text-gray-500">({resource.resource_id_value})</span>
                    </div>
                    {resource.notes && (
                      <p className="text-sm text-gray-600 mt-1">{resource.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Added {formatDateTime(resource.added_at)}
                      {resource.addedByUser && (
                        <> by {[resource.addedByUser.first_name, resource.addedByUser.last_name].filter(Boolean).join(" ") || resource.addedByUser.email}</>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    {(resource.resource_type === "LEARNER" || resource.resource_type === "ENROLMENT") && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <Link
                          href={resource.resource_type === "LEARNER"
                            ? `/qcto/learners/${resource.resource_id_value}`
                            : `/qcto/enrolments/${resource.resource_id_value}`}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          View
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form (only if SUBMITTED or UNDER_REVIEW) */}
      {(submission.status === "SUBMITTED" || submission.status === "UNDER_REVIEW") && (
        <Card className="welcome-modal-pattern overflow-hidden border border-emerald-200/60 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <CardHeader className="bg-gradient-to-b from-emerald-50/40 to-transparent pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ClipboardCheck className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <CardTitle>Review Submission</CardTitle>
                <CardDescription>
                  Review this submission and provide your decision. Approved submissions grant QCTO access to all linked resources.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SubmissionReviewForm submission={submission} reviewAttachments={submission.reviewAttachments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
