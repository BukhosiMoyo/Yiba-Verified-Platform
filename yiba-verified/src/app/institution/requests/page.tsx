import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

interface PageProps {
  searchParams: {
    status?: string;
    limit?: string;
  };
}

/**
 * Institution QCTO Requests List Page
 * 
 * Server Component that displays QCTO requests for the institution.
 * - Fetches requests from DB directly (read-only)
 * - Institution scoping:
 *   - INSTITUTION_* roles: locked to their institution
 *   - PLATFORM_ADMIN: sees ALL requests (no institution filter - app owners see everything!)
 * - Ignores soft-deleted requests
 */
export default async function InstitutionRequestsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    deleted_at: null, // Only non-deleted requests
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
  // PLATFORM_ADMIN sees ALL requests (no institution_id filter - app owners see everything! 🦸)

  // Filter by status if provided
  const statusParam = searchParams.status;
  if (statusParam) {
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (validStatuses.includes(statusParam)) {
      where.status = statusParam;
    }
  }

  // Parse limit
  const limit = Math.min(
    searchParams.limit ? parseInt(searchParams.limit, 10) : 50,
    200 // Cap at 200
  );

  // Fetch requests
  const requests = await prisma.qCTORequest.findMany({
    where,
    select: {
      request_id: true,
      title: true,
      request_type: true,
      status: true,
      requested_at: true,
      reviewed_at: true,
      expires_at: true,
      created_at: true,
      requestedByUser: {
        select: {
          name: true,
          email: true,
        },
      },
      reviewedByUser: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          requestResources: true,
        },
      },
    },
    orderBy: {
      requested_at: "desc", // Newest first
    },
    take: limit,
  });

  // Format dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
    };
    return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">QCTO Requests</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Review and approve/reject QCTO requests for access to your institution's resources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            {requests.length} request{requests.length !== 1 ? "s" : ""} found
            {statusParam && ` with status "${statusParam}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Reviewed</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12">
                    <EmptyState
                      title="No QCTO requests found"
                      description={
                        statusParam
                          ? `No requests with status "${statusParam}" found.`
                          : "QCTO requests will appear here when QCTO requests access to your institution's resources for review purposes."
                      }
                      icon={<FileQuestion className="h-6 w-6" strokeWidth={1.5} />}
                      variant={statusParam ? "no-results" : "default"}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const statusInfo = formatStatus(request.status);
                  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
                  return (
                    <TableRow key={request.request_id}>
                      <TableCell className="font-medium">{request.title}</TableCell>
                      <TableCell>{request.request_type || "N/A"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {request.requestedByUser?.name || request.requestedByUser?.email || "N/A"}
                      </TableCell>
                      <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                      <TableCell>
                        {request.reviewed_at ? formatDateTime(request.reviewed_at) : "Not reviewed"}
                      </TableCell>
                      <TableCell>
                        {request.expires_at ? (
                          <span className={isExpired ? "text-red-600" : ""}>
                            {formatDate(request.expires_at)}
                            {isExpired && " (Expired)"}
                          </span>
                        ) : (
                          "No expiry"
                        )}
                      </TableCell>
                      <TableCell>{request._count.requestResources}</TableCell>
                      <TableCell>
                        <Link
                          href={`/institution/requests/${request.request_id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {request.status === "PENDING" ? "Review" : "View"}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  );
}
