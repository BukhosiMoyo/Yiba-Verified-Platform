import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

interface PageProps {
  searchParams: {
    status?: string;
    limit?: string;
  };
}

/**
 * QCTO Requests List Page
 * 
 * Server Component that displays QCTO requests.
 * - Fetches requests from DB directly (read-only)
 * - QCTO_USER: sees only their own requests (requested_by = userId)
 * - PLATFORM_ADMIN: sees all requests (app owners see everything! 🦸)
 * - Ignores soft-deleted requests
 */
export default async function QCTORequestsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userId = session.user.userId;

  // Only QCTO_USER and PLATFORM_ADMIN can access this page
  if (userRole !== "QCTO_USER" && userRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Build where clause
  const where: any = {
    deleted_at: null, // Only non-deleted requests
  };

  // QCTO_USER: Only see requests they created
  if (userRole === "QCTO_USER") {
    where.requested_by = userId;
  }
  // PLATFORM_ADMIN: sees ALL requests (no filter - app owners see everything! 🦸)

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
      institution_id: true,
      title: true,
      request_type: true,
      status: true,
      requested_at: true,
      reviewed_at: true,
      expires_at: true,
      created_at: true,
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
          registration_number: true,
        },
      },
      requestedByUser: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      reviewedByUser: {
        select: {
          first_name: true,
          last_name: true,
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
      requested_at: "desc",
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">QCTO Requests</h1>
        <p className="text-muted-foreground mt-2">
          Manage requests for access to institution resources
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            {requests.length} request{requests.length !== 1 ? "s" : ""} found
            {statusParam && ` with status "${statusParam}"`}
            {userRole === "QCTO_USER" && " (your requests)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institution</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => {
                  const statusInfo = formatStatus(request.status);
                  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
                  return (
                    <TableRow key={request.request_id}>
                      <TableCell className="font-medium">
                        {request.institution.trading_name || request.institution.legal_name}
                        {request.institution.registration_number && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({request.institution.registration_number})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{request.title}</TableCell>
                      <TableCell>{request.request_type || "N/A"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
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
                          href={`/qcto/requests/${request.request_id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
