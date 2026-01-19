import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DocumentVersionHistory } from "@/components/institution/DocumentVersionHistory";
import { DocumentReplaceForm } from "@/components/institution/DocumentReplaceForm";

interface PageProps {
  params: Promise<{
    documentId: string;
  }>;
}

/**
 * Institution Document Detail Page
 * 
 * Server Component that displays document details, version history, and flags.
 * - INSTITUTION_*: See documents from their institution
 * - PLATFORM_ADMIN: See all documents (app owners see everything! 🦸)
 */
export default async function InstitutionDocumentDetailPage({ params }: PageProps) {
  const { documentId } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    document_id: documentId,
  };

  // Enforce institution scoping rules
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    if (!userInstitutionId) {
      redirect("/unauthorized");
    }
    where.OR = [
      { related_entity: "INSTITUTION", related_entity_id: userInstitutionId },
      { related_entity: "LEARNER", learner: { institution_id: userInstitutionId } },
      { related_entity: "ENROLMENT", enrolment: { institution_id: userInstitutionId } },
      { related_entity: "READINESS", readiness: { institution_id: userInstitutionId } },
    ];
  }
  // PLATFORM_ADMIN can see ALL documents (no institution scoping - app owners see everything!)

  // Fetch document with version history
  const document = await prisma.document.findFirst({
    where,
    include: {
      uploadedByUser: {
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      },
      flags: {
        include: {
          flaggedByUser: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          resolvedByUser: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!document) {
    notFound();
  }

  // Get all versions of this document (same related_entity + related_entity_id + document_type)
  const versions = await prisma.document.findMany({
    where: {
      related_entity: document.related_entity,
      related_entity_id: document.related_entity_id,
      document_type: document.document_type,
    },
    include: {
      uploadedByUser: {
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: { version: "desc" },
  });

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPLOADED":
        return <Badge variant="default">Uploaded</Badge>;
      case "FLAGGED":
        return <Badge variant="destructive">Flagged</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Accepted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format related entity type
  const formatEntityType = (entity: string) => {
    return entity.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Check if user can replace document (must be INSTITUTION_* role)
  const canReplace = userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/institution/documents" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to Documents
            </Link>
          </div>
          <h1 className="text-3xl font-bold mt-2">{document.file_name}</h1>
          <p className="text-muted-foreground mt-1">
            Version {document.version} • {formatFileSize(document.file_size_bytes)}
          </p>
        </div>
        {canReplace && (
          <Button asChild variant="outline">
            <Link href={`/institution/documents/${documentId}/replace`}>Replace Document</Link>
          </Button>
        )}
      </div>

      {/* Document Details */}
      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">File Name</span>
              <p className="text-lg">{document.file_name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Document Type</span>
              <p className="text-lg">{document.document_type}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Version</span>
              <p className="text-lg">
                <Badge variant="outline">v{document.version}</Badge>
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <p className="text-lg">{getStatusBadge(document.status)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Related Entity</span>
              <p className="text-lg">{formatEntityType(document.related_entity)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                ID: {document.related_entity_id}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">File Size</span>
              <p className="text-lg">{formatFileSize(document.file_size_bytes)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">MIME Type</span>
              <p className="text-lg">{document.mime_type || "Unknown"}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Storage Key</span>
              <p className="text-sm font-mono text-muted-foreground break-all">
                {document.storage_key || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Uploaded By</span>
              <p className="text-lg">
                {document.uploadedByUser.first_name && document.uploadedByUser.last_name
                  ? `${document.uploadedByUser.first_name} ${document.uploadedByUser.last_name}`
                  : document.uploadedByUser.email}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{document.uploadedByUser.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Uploaded At</span>
              <p className="text-lg">{document.uploaded_at.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flags */}
      {document.flags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flags</CardTitle>
            <CardDescription>QCTO flags and resolutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {document.flags.map((flag) => (
                <div
                  key={flag.flag_id}
                  className={`p-4 border rounded-lg ${
                    flag.status === "ACTIVE" ? "bg-amber-50 border-amber-200" : "bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={flag.status === "ACTIVE" ? "destructive" : "outline"}>
                          {flag.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Flagged by{" "}
                          {flag.flaggedByUser.first_name && flag.flaggedByUser.last_name
                            ? `${flag.flaggedByUser.first_name} ${flag.flaggedByUser.last_name}`
                            : flag.flaggedByUser.email}{" "}
                          on {flag.created_at.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{flag.reason}</p>
                      {flag.resolvedByUser && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Resolved by{" "}
                          {flag.resolvedByUser.first_name && flag.resolvedByUser.last_name
                            ? `${flag.resolvedByUser.first_name} ${flag.resolvedByUser.last_name}`
                            : flag.resolvedByUser.email}{" "}
                          on {flag.resolved_at?.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      <DocumentVersionHistory
        currentDocumentId={documentId}
        versions={versions.map((v) => ({
          document_id: v.document_id,
          version: v.version,
          file_name: v.file_name,
          status: v.status,
          uploaded_at: v.uploaded_at.toISOString(),
          uploaded_by: v.uploaded_by,
          uploadedBy: {
            user_id: v.uploadedByUser.user_id,
            email: v.uploadedByUser.email,
            name:
              v.uploadedByUser.first_name && v.uploadedByUser.last_name
                ? `${v.uploadedByUser.first_name} ${v.uploadedByUser.last_name}`
                : v.uploadedByUser.email,
          },
          isCurrentVersion: v.document_id === documentId,
        }))}
      />
    </div>
  );
}
