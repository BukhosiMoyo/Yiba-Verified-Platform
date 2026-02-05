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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    deleted_at: null, // Only non-deleted requests
  };

  // Institution scoping - layout already ensures user has correct role
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles must be scoped to their institution
    if (userInstitutionId) {
      where.institution_id = userInstitutionId;
    } else {
      // Return empty results if no institutionId
      where.institution_id = "__NO_INSTITUTION__";
    }
  }

  // Filter by status if provided
  const statusParam = searchParams.status;
  if (statusParam) {
    where.status = statusParam;
  }

  // Parse limit
  const limit = Math.min(
    searchParams.limit ? parseInt(searchParams.limit, 10) : 50,
    200
  );

  // Fetch requests
  const requests = await prisma.qCTORequest.findMany({
    where,
    select: {
      request_id: true,
      reference_code: true,
      title: true,
      type: true,
      status: true,
      requested_at: true,
      due_at: true,
      reviewed_at: true,
      created_at: true,
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
          evidenceLinks: true,
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
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { label: "Approved", className: "bg-green-100 text-green-800" };
      case "REJECTED":
        return { label: "Rejected", className: "bg-red-100 text-red-800" };
      case "RETURNED_FOR_CORRECTION":
        return { label: "Returned", className: "bg-orange-100 text-orange-800" };
      case "SUBMITTED":
        return { label: "Submitted", className: "bg-blue-100 text-blue-800" };
      case "UNDER_REVIEW":
        return { label: "Under Review", className: "bg-purple-100 text-purple-800" };
      case "IN_PROGRESS":
        return { label: "In Progress", className: "bg-yellow-100 text-yellow-800" };
      case "SENT":
      case "PENDING":
        return { label: "New Request", className: "bg-white border text-blue-600" };
      case "DRAFT":
        return { label: "Draft", className: "bg-gray-100 text-gray-800" };
      case "CANCELLED":
        return { label: "Cancelled", className: "bg-gray-100 text-gray-600" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">QCTO Requests</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Review and respond to requests from QCTO.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Inbox</CardTitle>
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
                  <TableHead>Ref</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12">
                      <EmptyState
                        title="No requests found"
                        description={
                          statusParam
                            ? `No requests with status "${statusParam}" found.`
                            : "You have no requests from QCTO at this time."
                        }
                        icon={<FileQuestion className="h-6 w-6" strokeWidth={1.5} />}
                        variant={statusParam ? "no-results" : "default"}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => {
                    const statusInfo = formatStatus(request.status);
                    const isOverdue =
                      request.due_at &&
                      new Date(request.due_at) < new Date() &&
                      !["APPROVED", "REJECTED", "CANCELLED", "SUBMITTED", "UNDER_REVIEW"].includes(request.status);

                    return (
                      <TableRow key={request.request_id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {request.reference_code || "—"}
                        </TableCell>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell className="text-xs">{request.type?.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                          {isOverdue && (
                            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                              Overdue
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {[request.requestedByUser?.first_name, request.requestedByUser?.last_name].filter(Boolean).join(" ") || request.requestedByUser?.email || "—"}
                        </TableCell>
                        <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                        <TableCell>
                          {request.due_at ? (
                            <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                              {formatDate(request.due_at)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{request._count?.evidenceLinks ?? 0} items</TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/institution/requests/${request.request_id}`}
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            {["SENT", "IN_PROGRESS", "RETURNED_FOR_CORRECTION"].includes(request.status) ? "Respond" : "View"}
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
