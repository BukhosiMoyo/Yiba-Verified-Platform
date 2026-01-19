import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface PageProps {
  params: {
    requestId: string;
  };
}

/**
 * QCTO Request Details Page
 * 
 * Server Component that displays QCTO request details.
 * - Fetches request from DB directly (read-only)
 * - QCTO_USER: can view requests they created (requested_by = userId)
 * - PLATFORM_ADMIN: can view any request (app owners see everything! 🦸)
 * - Ignores soft-deleted requests
 */
export default async function QCTORequestDetailsPage({ params }: PageProps) {
  const { requestId } = params;

  // Get session (layout already ensures auth, but we need role/userId for access check)
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

  // Build where clause with access control
  const where: any = {
    request_id: requestId,
    deleted_at: null, // Only non-deleted
  };

  // QCTO_USER: Only see requests they created
  if (userRole === "QCTO_USER") {
    where.requested_by = userId;
  }
  // PLATFORM_ADMIN: can view any request (no filter - app owners see everything! 🦸)

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
      reviewed_at: true,
      response_notes: true,
      expires_at: true,
      created_at: true,
      updated_at: true,
      deleted_at: true, // Include to check soft-delete
      institution: {
        select: {
          institution_id: true,
          name: true,
          code: true,
          type: true,
        },
      },
      requestedByUser: {
        select: {
          user_id: true,
          name: true,
          email: true,
        },
      },
      reviewedByUser: {
        select: {
          user_id: true,
          name: true,
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Request Details</h1>
        <p className="text-muted-foreground mt-2">
          View QCTO request information and linked resources
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
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Institution</p>
              <p className="text-base">
                {request.institution.name}
                {request.institution.code && (
                  <span className="text-sm text-muted-foreground ml-1">
                    ({request.institution.code})
                  </span>
                )}
              </p>
            </div>

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
              <p className="text-sm font-medium text-muted-foreground">Requested At</p>
              <p className="text-base">{formatDateTime(request.requested_at)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Requested By</p>
              <p className="text-base">
                {request.requestedByUser.name || request.requestedByUser.email}
              </p>
            </div>

            {request.reviewed_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviewed At</p>
                <p className="text-base">{formatDateTime(request.reviewed_at)}</p>
              </div>
            )}

            {request.reviewedByUser && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviewed By</p>
                <p className="text-base">
                  {request.reviewedByUser.name || request.reviewedByUser.email}
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

      {/* Request Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Requested Resources</CardTitle>
          <CardDescription>
            {request.requestResources.length} resource
            {request.requestResources.length !== 1 ? "s" : ""} requested
            {request.status === "APPROVED" && " (access granted)"}
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
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
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
                  <div>
                    {/* Link to resource based on type (only if request is APPROVED) */}
                    {request.status === "APPROVED" && (
                      <>
                        {resource.resource_type === "LEARNER" && (
                          <Link
                            href={`/qcto/learners/${resource.resource_id_value}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </Link>
                        )}
                        {resource.resource_type === "ENROLMENT" && (
                          <Link
                            href={`/qcto/enrolments/${resource.resource_id_value}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </Link>
                        )}
                      </>
                    )}
                    {request.status !== "APPROVED" && (
                      <span className="text-sm text-muted-foreground">Pending approval</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
