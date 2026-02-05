import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QctoRequestReviewActions } from "@/components/qcto/QctoRequestReviewActions";
import { FileText } from "lucide-react";

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function QCTORequestDetailsPage({ params }: PageProps) {
  const { requestId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  const userRole = session.user.role;
  const userId = session.user.userId;

  if (!canAccessQctoData(userRole)) redirect("/unauthorized");

  const where: any = { request_id: requestId, deleted_at: null };
  if (userRole === "QCTO_USER") where.requested_by = userId;

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
      created_at: true,
      updated_at: true,
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
          registration_number: true,
        },
      },
      requestedByUser: {
        select: { first_name: true, last_name: true, email: true },
      },
      reviewedByUser: {
        select: { first_name: true, last_name: true, email: true },
      },
      evidenceLinks: {
        select: {
          link_id: true,
          document: { select: { document_id: true, file_name: true, mime_type: true, uploaded_at: true } },
          submission: { select: { submission_id: true, title: true } },
        }
      }
    },
  });

  if (!request) notFound();

  const formatDateTime = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-muted-foreground">{request.reference_code}</span>
            {getStatusBadge(request.status)}
            {isOverdue && <span className="text-destructive text-sm font-bold">Overdue</span>}
          </div>
          <h1 className="text-3xl font-bold">{request.title}</h1>
          <p className="text-muted-foreground">
            Requests &raquo; {request.institution.trading_name || request.institution.legal_name}
          </p>
        </div>
        <div>
          <QctoRequestReviewActions requestId={request.request_id} currentStatus={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="whitespace-pre-wrap">{request.description || "No description."}</p>
              </div>

              {request.response_notes && (
                <div className="bg-muted/30 p-4 rounded-md border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Institution Response Notes</h4>
                  <p className="whitespace-pre-wrap">{request.response_notes}</p>
                </div>
              )}

              {request.decision && (
                <div className={`p-4 rounded-md border ${request.decision === "REJECTED" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                  <h4 className="text-sm font-medium mb-1">
                    Review Decision: {request.decision}
                  </h4>
                  <p className="text-sm">{request.decision_notes}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    By {[request.reviewedByUser?.first_name, request.reviewedByUser?.last_name].join(" ")} on {formatDateTime(request.reviewed_at)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence & Attachments</CardTitle>
              <CardDescription>Documents and submissions provided by the institution</CardDescription>
            </CardHeader>
            <CardContent>
              {request.evidenceLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No evidence attached yet.</div>
              ) : (
                <div className="space-y-2">
                  {request.evidenceLinks.map(link => (
                    <div key={link.link_id} className="flex items-center p-3 border rounded-md hover:bg-muted/50 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-full mr-3">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {link.document?.file_name || link.submission?.title || "Unknown Evidence"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {link.document ? "Document" : "Submission"} • {link.document?.mime_type}
                        </p>
                      </div>
                      {link.document && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`/api/documents/${link.document.document_id}/download`} target="_blank" rel="noreferrer">View</a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground block">Type</span>
                <span className="font-medium">{request.type}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Requested By</span>
                <span>{[request.requestedByUser?.first_name, request.requestedByUser?.last_name].join(" ")}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Date Requested</span>
                <span>{formatDateTime(request.requested_at)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Due Date</span>
                <span className={isOverdue ? "text-destructive font-bold" : ""}>
                  {request.due_at ? new Date(request.due_at).toLocaleDateString() : "None"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Institution</CardTitle></CardHeader>
            <CardContent>
              <div className="font-medium">{request.institution.trading_name}</div>
              <div className="text-sm text-muted-foreground">{request.institution.legal_name}</div>
              <div className="text-sm text-muted-foreground mt-1">Reg: {request.institution.registration_number}</div>
              <Link href={`/qcto/institutions/${request.institution.institution_id}`} className="text-xs text-primary hover:underline mt-2 block">
                View Institution Profile
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
