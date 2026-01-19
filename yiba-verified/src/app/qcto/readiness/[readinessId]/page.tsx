import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ReadinessReviewForm } from "@/components/qcto/ReadinessReviewForm";

interface PageProps {
  params: Promise<{
    readinessId: string;
  }>;
}

/**
 * QCTO Readiness Detail Page
 * 
 * Server Component that displays readiness record details for QCTO review.
 * - QCTO_USER: can view any readiness record
 * - PLATFORM_ADMIN: can view any readiness record (app owners see everything! 🦸)
 */
export default async function QCTOReadinessDetailPage({ params }: PageProps) {
  const { readinessId } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  // Only QCTO_USER and PLATFORM_ADMIN can access
  if (userRole !== "QCTO_USER" && userRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Fetch readiness record
  const readiness = await prisma.readiness.findFirst({
    where: {
      readiness_id: readinessId,
      deleted_at: null,
    },
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
          version: true,
          status: true,
          uploaded_at: true,
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
    },
  });

  if (!readiness) {
    notFound();
  }

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return <Badge variant="outline">Not Started</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "SUBMITTED":
        return <Badge variant="default">Submitted</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-purple-100 text-purple-800">Under Review</Badge>;
      case "RETURNED_FOR_CORRECTION":
        return <Badge className="bg-orange-100 text-orange-800">Returned</Badge>;
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>;
      case "RECOMMENDED":
        return <Badge className="bg-green-100 text-green-800">Recommended</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/qcto/readiness" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to Readiness Records
            </Link>
          </div>
          <h1 className="text-3xl font-bold mt-2">
            {readiness.qualification_title || "Readiness Record"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Review Form 5 Programme Delivery Readiness
          </p>
        </div>
      </div>

      {/* Readiness Details */}
      <Card>
        <CardHeader>
          <CardTitle>Readiness Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Qualification Title</span>
              <p className="text-lg">{readiness.qualification_title || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">SAQA ID</span>
              <p className="text-lg">{readiness.saqa_id || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">NQF Level</span>
              <p className="text-lg">{readiness.nqf_level ? `NQF ${readiness.nqf_level}` : "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Curriculum Code</span>
              <p className="text-lg">{readiness.curriculum_code || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Delivery Mode</span>
              <p className="text-lg">
                {readiness.delivery_mode
                  ? readiness.delivery_mode.replace(/_/g, " ")
                  : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <p className="text-lg">{getStatusBadge(readiness.readiness_status)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Institution</span>
              <p className="text-lg">
                {readiness.institution.trading_name || readiness.institution.legal_name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Documents</span>
              <p className="text-lg">{readiness.documents.length} document(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QCTO Recommendation */}
      {readiness.recommendation && (
        <Card>
          <CardHeader>
            <CardTitle>QCTO Recommendation</CardTitle>
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
                <p className="text-lg">
                  <Badge variant="outline">{readiness.recommendation.recommendation}</Badge>
                </p>
              </div>
              {readiness.recommendation.remarks && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Remarks</span>
                  <p className="text-sm whitespace-pre-wrap mt-2 p-4 bg-muted rounded-md">
                    {readiness.recommendation.remarks}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Review Readiness Record</CardTitle>
          <CardDescription>Submit your review decision and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <ReadinessReviewForm readiness={readiness} />
        </CardContent>
      </Card>
    </div>
  );
}
