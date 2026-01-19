import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import Link from "next/link";
import { FileCheck } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    limit?: string;
  }>;
}

/**
 * QCTO Readiness List Page
 * 
 * Server Component that displays readiness records QCTO can review.
 * - QCTO_USER: sees all readiness records
 * - PLATFORM_ADMIN: sees all readiness records (app owners see everything! 🦸)
 */
export default async function QCTOReadinessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  // Only QCTO_USER and PLATFORM_ADMIN can access
  if (userRole !== "QCTO_USER" && userRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Build where clause
  const where: any = {
    deleted_at: null, // Only non-deleted readiness records
  };

  // Filter by status if provided
  const statusParam = params.status;
  if (statusParam) {
    const validStatuses = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "RETURNED_FOR_CORRECTION", "REVIEWED", "RECOMMENDED", "REJECTED"];
    if (validStatuses.includes(statusParam)) {
      where.readiness_status = statusParam;
    }
  }

  // Parse limit
  const limit = Math.min(
    params.limit ? parseInt(params.limit, 10) : 50,
    200 // Cap at 200
  );

  // Fetch readiness records
  const readinessRecords = await prisma.readiness.findMany({
    where,
    include: {
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
        },
      },
      recommendation: {
        select: {
          recommendation_id: true,
          recommendation: true,
          remarks: true,
          created_at: true,
        },
      },
      _count: {
        select: {
          documents: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  // Format status badge
  const badgeClass = "font-semibold";
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return <Badge variant="outline" className={badgeClass}>Not Started</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="secondary" className={badgeClass}>In Progress</Badge>;
      case "SUBMITTED":
        return <Badge variant="default" className={badgeClass}>Submitted</Badge>;
      case "UNDER_REVIEW":
        return <Badge className={`bg-purple-100 text-purple-800 ${badgeClass}`}>Under Review</Badge>;
      case "RETURNED_FOR_CORRECTION":
        return <Badge className={`bg-orange-100 text-orange-800 ${badgeClass}`}>Returned</Badge>;
      case "REVIEWED":
        return <Badge className={`bg-blue-100 text-blue-800 ${badgeClass}`}>Reviewed</Badge>;
      case "RECOMMENDED":
        return <Badge className={`bg-green-100 text-green-800 ${badgeClass}`}>Recommended</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className={badgeClass}>Rejected</Badge>;
      default:
        return <Badge variant="outline" className={badgeClass}>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Form 5 Readiness Records</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Review institution readiness records for programme delivery
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Readiness Records</h2>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
            {readinessRecords.length} record{readinessRecords.length !== 1 ? "s" : ""} found
            {statusParam && (
              <>
                {" "}with status{" "}
                {getStatusBadge(statusParam)}
              </>
            )}
          </p>
        </div>
        {readinessRecords.length === 0 ? (
          <EmptyState
            title="No readiness records found"
            description={
              statusParam
                ? `No readiness records with status "${statusParam}" are available for review.`
                : "Form 5 readiness records from institutions will appear here once they are submitted for QCTO review."
            }
            icon={<FileCheck className="h-6 w-6" strokeWidth={1.5} />}
            variant="no-results"
          />
        ) : (
          <ResponsiveTable>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qualification</TableHead>
                  <TableHead>SAQA ID</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>NQF Level</TableHead>
                  <TableHead>Delivery Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readinessRecords.map((readiness) => (
                  <TableRow key={readiness.readiness_id}>
                    <TableCell className="font-medium">
                      {readiness.qualification_title || "Untitled"}
                    </TableCell>
                    <TableCell>{readiness.saqa_id || "N/A"}</TableCell>
                    <TableCell>
                      {readiness.institution.trading_name || readiness.institution.legal_name}
                    </TableCell>
                    <TableCell>
                      {readiness.nqf_level ? `NQF ${readiness.nqf_level}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {readiness.delivery_mode
                        ? readiness.delivery_mode.replace(/_/g, " ")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(readiness.readiness_status)}</TableCell>
                    <TableCell>{readiness._count.documents}</TableCell>
                    <TableCell>
                      {readiness.recommendation ? (
                        <Badge variant="outline">{readiness.recommendation.recommendation}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/qcto/readiness/${readiness.readiness_id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        Review
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ResponsiveTable>
          )}
        </div>
    </div>
  );
}
