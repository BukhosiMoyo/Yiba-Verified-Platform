import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestResponseUI } from "@/components/qcto/RequestResponseUI";

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
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    request_id: requestId,
    deleted_at: null,
  };

  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    if (!userInstitutionId) {
      redirect("/unauthorized");
    }
    where.institution_id = userInstitutionId;
  }

  // Fetch request
  const request = await prisma.qCTORequest.findFirst({
    where,
    select: {
      request_id: true,
      reference_code: true,
      institution_id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      requested_at: true,
      due_at: true,
      reviewed_at: true,
      decision: true,
      decision_notes: true,
      response_notes: true,
      config_json: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
        },
      },
      requestedByUser: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      evidenceLinks: {
        select: {
          link_id: true,
          document: { select: { document_id: true, file_name: true, mime_type: true } },
          submission: { select: { submission_id: true, title: true } },
        }
      }
    },
  });

  if (!request || request.deleted_at !== null) {
    notFound();
  }

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

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Status Badge Logic
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Approved</span>;
      case "REJECTED": return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">Rejected</span>;
      case "RETURNED_FOR_CORRECTION": return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">Returned</span>;
      case "SUBMITTED": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">Submitted</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{status}</span>;
    }
  };

  const isOverdue = request.due_at && new Date(request.due_at) < new Date() && !["APPROVED", "REJECTED", "CANCELLED", "SUBMITTED", "UNDER_REVIEW"].includes(request.status);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-mono text-muted-foreground">{request.reference_code || "NO-REF"}</span>
          {getStatusBadge(request.status)}
          {isOverdue && <span className="text-destructive text-sm font-bold">Overdue</span>}
        </div>
        <h1 className="text-3xl font-bold">{request.title}</h1>
        <p className="text-muted-foreground mt-2">
          {request.type?.replace(/_/g, " ")} Request
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description & Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap">{request.description || "No description provided."}</div>

              {/* Render specific config if needed, e.g. doc types */}
              {request.config_json && (
                <div className="mt-4 bg-muted p-4 rounded-md">
                  <pre className="text-xs overflow-auto">{JSON.stringify(request.config_json, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response & Evidence</CardTitle>
              <CardDescription>Upload documents or link submissions to fulfill this request.</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestResponseUI
                requestId={request.request_id}
                institutionId={request.institution_id}
                status={request.status}
                evidenceLinks={request.evidenceLinks}
                existingNotes={request.response_notes}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground block">Requested By</span>
                <span className="font-medium">
                  {[request.requestedByUser?.first_name, request.requestedByUser?.last_name].filter(Boolean).join(" ") || request.requestedByUser.email}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Requested Date</span>
                <span>{formatDateTime(request.requested_at)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Due Date</span>
                <span className={isOverdue ? "text-destructive font-bold" : ""}>
                  {formatDate(request.due_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {request.decision && (
            <Card className={request.decision === "REJECTED" ? "border-red-200 bg-red-50 dark:bg-red-900/10" : "border-green-200 bg-green-50 dark:bg-green-900/10"}>
              <CardHeader>
                <CardTitle>Review Outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold mb-2">{request.decision}</div>
                <p className="text-sm">{request.decision_notes}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  Reviewed: {formatDateTime(request.reviewed_at)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
