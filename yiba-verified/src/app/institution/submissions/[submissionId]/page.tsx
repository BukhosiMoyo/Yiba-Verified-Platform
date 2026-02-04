import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubmissionEditForm } from "@/components/institution/SubmissionEditForm";
import { AddResourceForm } from "@/components/institution/AddResourceForm";
import { RemoveResourceButton } from "@/components/institution/RemoveResourceButton";

interface PageProps {
  params: Promise<{
    submissionId: string;
  }>;
}

/**
 * Institution Submission Details Page
 * 
 * Server Component that displays submission details and editing forms.
 * - Fetches submission from DB directly (read-only)
 * - Enforces institution scoping:
 *   - INSTITUTION_* roles: must match ctx institution_id
 *   - PLATFORM_ADMIN: can view ALL submissions (no institution scoping - app owners see everything!)
 * - Ignores soft-deleted submissions (deleted_at must be null)
 */
export default async function InstitutionSubmissionDetailsPage({ params }: PageProps) {
  const { submissionId } = await params;

  // Get session (layout already ensures auth, but we need role/institutionId for scoping)
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    submission_id: submissionId,
    deleted_at: null, // Only non-deleted
  };

  // Enforce institution scoping rules
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles can only view submissions from their own institution
    if (!userInstitutionId) {
      redirect("/unauthorized");
    }
    where.institution_id = userInstitutionId;
  }
  // PLATFORM_ADMIN can view ALL submissions (no institution scoping check - app owners see everything! 🦸)

  // Fetch submission from database
  const submission = await prisma.submission.findFirst({
    where,
    select: {
      reference_code: true,
      institution_id: true,
      title: true,
      submission_type: true,
      status: true,
      submitted_at: true,
      reviewed_at: true,
      review_notes: true,
      created_at: true,
      updated_at: true,
      deleted_at: true, // Include to check soft-delete
      submittedByUser: {
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
      items: {
        select: {
          submission_item_id: true,
          type: true,
          status: true,
          config_json: true,
          metrics_snapshot_json: true,
          updated_at: true,
        },
        orderBy: { created_at: "asc" }
      },
      submissionResources: {
        select: {
          resource_id: true,
          resource_type: true,
          resource_id_value: true,
          added_at: true,
          notes: true,
          addedByUser: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: {
          added_at: "desc",
        },
      },
    },
  });

  // Check if submission exists and is not soft-deleted
  if (!submission || submission.deleted_at !== null) {
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
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800" },
      SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-800" },
      UNDER_REVIEW: { label: "Under Review", className: "bg-purple-100 text-purple-800" },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
      RETURNED_FOR_CORRECTION: { label: "Returned for Correction", className: "bg-orange-100 text-orange-800" },
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

  const statusInfo = formatStatus(submission.status);
  const canEdit = submission.status === "DRAFT" || submission.status === "SUBMITTED";

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Submission Details</h1>
            {submission.reference_code && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm font-mono border border-gray-200">
                {submission.reference_code}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-2">
            View and manage submission information and resources
          </p>
        </div>
      </div>

      {/* Submission Information */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Information</CardTitle>
          <CardDescription>
            Status:{" "}
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Title</p>
              <p className="text-base">{submission.title || "Untitled"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Submission Type</p>
              <p className="text-base">{submission.submission_type || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted At</p>
              <p className="text-base">
                {submission.submitted_at ? formatDateTime(submission.submitted_at) : "Not submitted"}
              </p>
            </div>

            {submission.submittedByUser && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                <p className="text-base">
                  {[submission.submittedByUser?.first_name, submission.submittedByUser?.last_name].filter(Boolean).join(" ") || submission.submittedByUser?.email}
                </p>
              </div>
            )}

            {submission.reviewed_at && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reviewed At</p>
                  <p className="text-base">{formatDateTime(submission.reviewed_at)}</p>
                </div>

                {submission.reviewedByUser && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reviewed By</p>
                    <p className="text-base">
                      {[submission.reviewedByUser?.first_name, submission.reviewedByUser?.last_name].filter(Boolean).join(" ") || submission.reviewedByUser?.email}
                    </p>
                  </div>
                )}
              </>
            )}

            {submission.review_notes && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Review Notes</p>
                <p className="text-base whitespace-pre-wrap">{submission.review_notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base">{formatDateTime(submission.created_at)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Updated At</p>
              <p className="text-base">{formatDateTime(submission.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      import {SubmissionItemCard} from "@/components/institution/submissions/SubmissionItemCard";

      {/* NEW: Submission Items */}
      {submission.items && submission.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submission Content</CardTitle>
            <CardDescription>
              Data packages included in this submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submission.items.map((item: any) => (
                <SubmissionItemCard
                  key={item.submission_item_id}
                  item={item}
                  isEditable={canEdit}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Resources (Legacy) */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy Resources</CardTitle>
          <CardDescription>
            {submission.submissionResources.length} resource
            {submission.submissionResources.length !== 1 ? "s" : ""} linked to this submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submission.submissionResources.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No legacy resources linked.</p>
          ) : (
            <div className="space-y-3">
              {submission.submissionResources.map((resource) => (
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
                      {resource.addedByUser && (
                        <> by {[resource.addedByUser?.first_name, resource.addedByUser?.last_name].filter(Boolean).join(" ") || resource.addedByUser?.email}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Link to resource based on type */}
                    {resource.resource_type === "LEARNER" && (
                      <Link
                        href={`/institution/learners/${resource.resource_id_value}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                    )}
                    {resource.resource_type === "ENROLMENT" && (
                      <Link
                        href={`/institution/enrolments/${resource.resource_id_value}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                    )}
                    {/* Delete button (only if editable) */}
                    {canEdit && (
                      <RemoveResourceButton
                        submissionId={submission.submission_id}
                        resourceId={resource.resource_id}
                        resourceType={resource.resource_type}
                        resourceIdValue={resource.resource_id_value}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form (only if draft or submitted) */}
      {canEdit && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Edit Submission</CardTitle>
              <CardDescription>
                Update submission details or submit to QCTO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionEditForm submission={submission} />
            </CardContent>
          </Card>

          {/* Add Resource Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Resource</CardTitle>
              <CardDescription>
                Add a resource (learner, enrolment, document, etc.) to this submission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddResourceForm submissionId={submission.submission_id} />
            </CardContent>
          </Card>
        </>
      )}

      {!canEdit && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              This submission is {submission.status.toLowerCase()} and cannot be edited. Contact QCTO for review updates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
