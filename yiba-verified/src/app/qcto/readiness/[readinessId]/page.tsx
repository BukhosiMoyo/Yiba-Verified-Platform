import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { hasCap } from "@/lib/capabilities";
import { getReviewAssignments } from "@/lib/reviewAssignments";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QualificationOverview } from "@/components/qcto/readiness/QualificationOverview";
import { InstitutionProfileSnapshot } from "@/components/qcto/readiness/InstitutionProfileSnapshot";
import { InstitutionTrustScore } from "@/components/qcto/readiness/InstitutionTrustScore";
import { ReadinessContentDisplay } from "@/components/qcto/readiness/ReadinessContentDisplay";
import { DocumentsEvidenceViewer } from "@/components/qcto/readiness/DocumentsEvidenceViewer";
import { ReviewHelperPanel } from "@/components/qcto/readiness/ReviewHelperPanel";
import { ReadinessAssignmentBlock } from "@/components/qcto/readiness/ReadinessAssignmentBlock";
import { ReadinessReviewForm } from "@/components/qcto/readiness/ReadinessReviewForm";
import { ReviewHistory } from "@/components/qcto/readiness/ReviewHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    readinessId: string;
  }>;
}

/**
 * QCTO Readiness Detail Page
 * 
 * Server Component that displays readiness record details for QCTO review.
 * Redesigned according to Form 5 specification with full context and review tools.
 * - QCTO_USER: can view any readiness record (excluding drafts)
 * - PLATFORM_ADMIN: can view any readiness record
 */
export default async function QCTOReadinessDetailPage({ params }: PageProps) {
  const { readinessId } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  if (!canAccessQctoData(userRole)) {
    redirect("/unauthorized");
  }

  // Fetch readiness record with all related data
  // CRITICAL: QCTO must NEVER see NOT_STARTED or IN_PROGRESS records
  const readiness = await prisma.readiness.findFirst({
    where: {
      readiness_id: readinessId,
      deleted_at: null,
      readiness_status: {
        notIn: ["NOT_STARTED", "IN_PROGRESS"], // QCTO cannot see drafts
      },
    },
    include: {
      qualification_registry: {
        select: { id: true, name: true, saqa_id: true, curriculum_code: true, nqf_level: true, credits: true, occupational_category: true },
      },
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
          province: true,
        },
      },
      documents: {
        orderBy: { uploaded_at: "desc" },
        include: {
          documentFlags: {
            where: {
              status: { in: ["FLAGGED", "VERIFIED"] },
            },
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
            orderBy: { created_at: "desc" },
          },
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
      sectionReviews: {
        include: {
          reviewer: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      },
      facilitators: {
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!readiness) {
    notFound();
  }

  // Additional safety check: If somehow a draft record was fetched, prevent access
  if (readiness.readiness_status === "NOT_STARTED" || readiness.readiness_status === "IN_PROGRESS") {
    notFound(); // QCTO cannot view drafts
  }

  const canAssign =
    userRole === "PLATFORM_ADMIN" || hasCap(userRole, "QCTO_ASSIGN");
  const canReview =
    userRole === "PLATFORM_ADMIN" ||
    hasCap(userRole, "QCTO_REVIEW") ||
    hasCap(userRole, "QCTO_RECORD_RECOMMENDATION");
  const assignments = await getReviewAssignments("READINESS", readinessId);

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <Badge variant="default">Submitted</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">Under Review</Badge>;
      case "RETURNED_FOR_CORRECTION":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">Returned</Badge>;
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">Reviewed</Badge>;
      case "RECOMMENDED":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">Recommended</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Prepare document flags for DocumentsEvidenceViewer
  const documentFlags = readiness.documents.flatMap((doc) =>
    doc.documentFlags.map((flag) => ({
      document_id: doc.document_id,
      reason: flag.reason,
      status: flag.status,
      flagged_by: flag.flaggedBy.first_name + " " + flag.flaggedBy.last_name,
      created_at: flag.created_at,
    }))
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/qcto/readiness"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back to Readiness Records
            </Link>
          </div>
          <h1 className="text-3xl font-bold mt-2">
            {readiness.qualification_title || "Readiness Record"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-muted-foreground">Review Form 5 Programme Delivery Readiness</p>
            {getStatusBadge(readiness.readiness_status)}
          </div>
        </div>
      </div>

      {/* Qualification Overview (Full Width) */}
      <QualificationOverview readiness={readiness} />

      {/* Institution Profile & Trust Score (Side by Side) */}
      <div className="grid gap-6 md:grid-cols-2">
        <InstitutionProfileSnapshot institutionId={readiness.institution_id} />
        <InstitutionTrustScore institutionId={readiness.institution_id} />
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Readiness Content & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Full Readiness Content Display */}
          <ReadinessContentDisplay
            readiness={readiness}
            sectionReviews={readiness.sectionReviews.map((sr) => ({
              section_name: sr.section_name,
              criterion_key: sr.criterion_key || undefined,
              response: sr.response || undefined,
              mandatory_remarks: sr.mandatory_remarks || undefined,
              notes: sr.notes || undefined,
            }))}
          />

          {/* Documents & Evidence Viewer */}
          <DocumentsEvidenceViewer
            readinessId={readinessId}
            documents={readiness.documents.map((doc) => ({
              document_id: doc.document_id,
              file_name: doc.file_name,
              document_type: doc.document_type,
              mime_type: doc.mime_type || undefined,
              file_size_bytes: doc.file_size_bytes || undefined,
              uploaded_at: doc.uploaded_at,
              status: doc.status,
              flags: doc.documentFlags.map((flag) => ({
                flag_id: flag.flag_id,
                reason: flag.reason,
                status: flag.status,
                flagged_by: flag.flaggedBy.user_id,
                created_at: flag.created_at,
              })),
            }))}
          />
        </div>

        {/* Right Column: Assignment + Review Helper Panel (Sticky Sidebar) */}
        <div className="lg:col-span-1 self-start space-y-6">
          <ReadinessAssignmentBlock
            readinessId={readinessId}
            institutionProvince={readiness.institution.province}
            canAssign={canAssign}
            initialAssignments={assignments.map((a) => ({
              ...a,
              assigned_at: a.assigned_at.toISOString(),
            }))}
          />
          <ReviewHelperPanel
            readiness={readiness}
            documentFlags={documentFlags}
          />
        </div>
      </div>

      {/* Review Form (Bottom) - only for reviewers and admins */}
      {canReview ? (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle>Review Readiness Record</CardTitle>
            <CardDescription>
              Submit your review decision and recommendations (Form 5 Section 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReadinessReviewForm readiness={readiness} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-l-4 border-l-muted">
          <CardHeader>
            <CardTitle>Review Readiness Record</CardTitle>
            <CardDescription>
              You have read-only access. Only reviewers and admins can submit recommendations.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Review History */}
      <ReviewHistory readinessId={readinessId} />

      {/* Previous Recommendation Display (if exists) */}
      {readiness.recommendation && (
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle>Previous QCTO Recommendation</CardTitle>
            <CardDescription>
              Recommendation by{" "}
              {readiness.recommendation.recommendedByUser.first_name &&
              readiness.recommendation.recommendedByUser.last_name
                ? `${readiness.recommendation.recommendedByUser.first_name} ${readiness.recommendation.recommendedByUser.last_name}`
                : readiness.recommendation.recommendedByUser.email}{" "}
              on {new Date(readiness.recommendation.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Recommendation</span>
                <div className="text-lg mt-1">
                  <Badge variant="outline">{readiness.recommendation.recommendation}</Badge>
                </div>
              </div>
              {readiness.recommendation.verifier_remarks && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Verifier Remarks</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {readiness.recommendation.verifier_remarks}
                  </p>
                </div>
              )}
              {readiness.recommendation.remarks && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Remarks</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {readiness.recommendation.remarks}
                  </p>
                </div>
              )}
              {readiness.recommendation.sme_name && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">SME Name</span>
                  <p className="text-lg">{readiness.recommendation.sme_name}</p>
                </div>
              )}
              {readiness.recommendation.verification_date && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Verification Date</span>
                  <p className="text-lg">
                    {new Date(readiness.recommendation.verification_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
