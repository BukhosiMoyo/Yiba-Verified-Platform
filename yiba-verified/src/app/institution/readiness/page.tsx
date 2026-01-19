import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
 * Institution Readiness List Page
 * 
 * Server Component that displays readiness records for the institution.
 * - Fetches readiness records from DB directly (read-only)
 * - Institution scoping:
 *   - INSTITUTION_* roles: locked to their institution
 *   - PLATFORM_ADMIN: sees ALL readiness records (app owners see everything! 🦸)
 * - Ignores soft-deleted readiness records
 */
export default async function InstitutionReadinessPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    deleted_at: null, // Only non-deleted readiness records
  };

  // Institution scoping - layout already ensures user has correct role
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles must be scoped to their institution
    if (userInstitutionId) {
      where.institution_id = userInstitutionId;
    } else {
      // Return empty results if no institutionId (shouldn't happen in practice)
      where.institution_id = "__NO_INSTITUTION__"; // This will return no results
    }
  }
  // PLATFORM_ADMIN sees ALL readiness records (no institution filter - app owners see everything! 🦸)

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
    orderBy: { updated_at: "desc" },
    take: limit,
  });

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
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form 5 Readiness</h1>
          <p className="text-muted-foreground mt-2">
            Programme delivery readiness records for QCTO review
          </p>
        </div>
        <Link href="/institution/readiness/new">
          <Button>Create Readiness Record</Button>
        </Link>
      </div>

      {/* Readiness Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Readiness Records</CardTitle>
          <CardDescription>
            Form 5 readiness submissions for qualification delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readinessRecords.length === 0 ? (
            <EmptyState
              title="No readiness records found"
              description="Form 5 readiness records demonstrate your institution's capability to deliver a qualification. Create your first readiness record to get started."
              action={{
                label: "Create Readiness Record",
                href: "/institution/readiness/new",
              }}
              icon={<FileCheck className="h-6 w-6" strokeWidth={1.5} />}
            />
          ) : (
            <ResponsiveTable>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qualification</TableHead>
                  <TableHead>SAQA ID</TableHead>
                  <TableHead>NQF Level</TableHead>
                  <TableHead>Delivery Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readinessRecords.map((readiness) => (
                  <TableRow key={readiness.readiness_id}>
                    <TableCell className="font-medium">
                      {readiness.qualification_title}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {readiness.saqa_id}
                    </TableCell>
                    <TableCell>{readiness.nqf_level || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {readiness.delivery_mode.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(readiness.readiness_status)}>
                        {formatStatus(readiness.readiness_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {readiness._count.documents} {readiness._count.documents === 1 ? "document" : "documents"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(readiness.updated_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/institution/readiness/${readiness.readiness_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View / Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
