import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestApprovalForm } from "@/components/institution/RequestApprovalForm";

interface PageProps {
  params: Promise<{
    requestId: string;
  }>;
}

/**
 * Institution QCTO Request Details Page
 * 
 * Server Component that displays QCTO request details and approval form.
 * - Fetches request from DB directly (read-only)
 * - Enforces institution scoping:
 *   - INSTITUTION_* roles: must match ctx institution_id
 *   - PLATFORM_ADMIN: can view ALL requests (no institution scoping - app owners see everything!)
 * - Ignores soft-deleted requests (deleted_at must be null)
 */
export default async function InstitutionRequestDetailsPage({ params }: PageProps) {
  const { requestId } = await params;

  // Get session (layout already ensures auth, but we need role/institutionId for scoping)
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    request_id: requestId,
    deleted_at: null, // Only non-deleted
  };

  // Enforce institution scoping rules
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles can only view requests from their own institution
    if (!userInstitutionId) {
      redirect("/unauthorized");
    }
    where.institution_id = userInstitutionId;
  }
  // PLATFORM_ADMIN can view ALL requests (no institution scoping check - app owners see everything! 🦸)

  // Fetch request from database
  const request = await prisma.qCTORequest.findFirst({
    where,
    select: {
      request_id: true,
      institution_id: true,
      title: true,
      description: true,
      request_type: true,
      status: true,
      requested_at: true,
      response_deadline: true,
      reviewed_at: true,
      response_notes: true,
      expires_at: true,
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
      requestedByUser: {
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
      requestResources: {
        select: {
          resource_id: true,
          resource_type: true,
          resource_id_value: true,
          added_at: true,
          notes: true,
        },
        orderBy: {
          added_at: "desc",
        },
      },
    },
  });

  // Check if request exists and is not soft-deleted
  if (!request || request.deleted_at !== null) {
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
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
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

  const statusInfo = formatStatus(request.status);
  const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
  const isOverdue = request.status === "PENDING" && request.response_deadline && new Date(request.response_deadline) < new Date();
  const canApprove = request.status === "PENDING";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Request Details</h1>
        <p className="text-muted-foreground mt-2">
          Review QCTO request and approve or reject access to resources
        </p>
      </div>

      {/* Request Information */}
      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
          <CardDescription>
            Status:{" "}
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
            {isExpired && (
              <span className="ml-2 text-xs text-red-600">(Expired)</span>
            )}
            {isOverdue && (
              <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">(Response overdue)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Title</p>
              <p className="text-base">{request.title}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Request Type</p>
              <p className="text-base">{request.request_type || "N/A"}</p>
            </div>

            {request.description && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-base whitespace-pre-wrap">{request.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Requested By</p>
              <p className="text-base">
                {[request.requestedByUser.first_name, request.requestedByUser.last_name].filter(Boolean).join(" ") || request.requestedByUser.email}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Requested At</p>
              <p className="text-base">{formatDateTime(request.requested_at)}</p>
            </div>

            {request.response_deadline && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response By</p>
                <p className={`text-base ${isOverdue ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>
                  {formatDate(request.response_deadline)}
                  {isOverdue && " (Overdue)"}
                </p>
              </div>
            )}

            {request.expires_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expires At</p>
                <p className={`text-base ${isExpired ? "text-red-600" : ""}`}>
                  {formatDate(request.expires_at)}
                  {isExpired && " (Expired)"}
                </p>
              </div>
            )}

            {request.reviewed_at && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reviewed At</p>
                  <p className="text-base">{formatDateTime(request.reviewed_at)}</p>
                </div>

                {request.reviewedByUser && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reviewed By</p>
                    <p className="text-base">
                      {[request.reviewedByUser.first_name, request.reviewedByUser.last_name].filter(Boolean).join(" ") || request.reviewedByUser.email}
                    </p>
                  </div>
                )}
              </>
            )}

            {request.response_notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Response Notes</p>
                <p className="text-base whitespace-pre-wrap">{request.response_notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base">{formatDateTime(request.created_at)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Updated At</p>
              <p className="text-base">{formatDateTime(request.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requested Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Requested Resources</CardTitle>
          <CardDescription>
            {request.requestResources.length} resource
            {request.requestResources.length !== 1 ? "s" : ""} requested
          </CardDescription>
        </CardHeader>
        <CardContent>
          {request.requestResources.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No resources requested</p>
          ) : (
            <div className="space-y-3">
              {request.requestResources.map((resource) => (
                <div
                  key={resource.resource_id}
                  className="p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatResourceType(resource.resource_type)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({resource.resource_id_value})
                    </span>
                  </div>
                  {resource.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{resource.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Added: {formatDateTime(resource.added_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Form (only if pending) */}
      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Approve or Reject Request</CardTitle>
            <CardDescription>
              Review the request and provide a response. Approved requests grant QCTO access to the requested resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestApprovalForm requestId={request.request_id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
