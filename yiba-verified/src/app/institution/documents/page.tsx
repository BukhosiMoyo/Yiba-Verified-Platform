import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DocumentFilters } from "@/components/institution/DocumentFilters";
import { Button } from "@/components/ui/button";
import { File, FileText, Image, MoreVertical, Eye, FileUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";

interface PageProps {
  searchParams: Promise<{
    related_entity?: string;
    related_entity_id?: string;
    document_type?: string;
    status?: string;
    q?: string;
    limit?: string;
    offset?: string;
  }>;
}

/**
 * Institution Documents List Page
 * 
 * Server Component that displays documents/evidence for the institution.
 * - Fetches documents directly from DB (better performance)
 * - Institution scoping: INSTITUTION_* locked to their institution, PLATFORM_ADMIN sees ALL
 */
export default async function InstitutionDocumentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;
  
  // Allow INSTITUTION_* and PLATFORM_ADMIN (layout handles this, but double-check)
  if (userRole !== "INSTITUTION_ADMIN" && userRole !== "INSTITUTION_STAFF" && userRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Build where clause with institution scoping
  const where: any = {};

  // Enforce institution scoping rules
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    if (!userInstitutionId) {
      // Return empty results if no institutionId
      where.related_entity_id = "__NO_INSTITUTION__";
    } else {
      where.OR = [
        { related_entity: "INSTITUTION", related_entity_id: userInstitutionId },
        { related_entity: "LEARNER", learner: { institution_id: userInstitutionId } },
        { related_entity: "ENROLMENT", enrolment: { institution_id: userInstitutionId } },
        { related_entity: "READINESS", readiness: { institution_id: userInstitutionId } },
      ];
    }
  }
  // PLATFORM_ADMIN sees ALL documents (no institution scoping - app owners see everything!)

  // Apply filters
  if (params.related_entity) {
    where.related_entity = params.related_entity;
  }

  if (params.related_entity_id) {
    where.related_entity_id = params.related_entity_id;
  }

  if (params.document_type) {
    where.document_type = { contains: params.document_type, mode: "insensitive" };
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.q) {
    const qFilter = {
      OR: [
        { file_name: { contains: params.q, mode: "insensitive" } },
        { document_type: { contains: params.q, mode: "insensitive" } },
      ],
    };
    where.AND = where.AND ? [...where.AND, qFilter] : [qFilter];
  }

  // Pagination
  const limit = Math.min(parseInt(params.limit || "50"), 200);
  const offset = parseInt(params.offset || "0");

  const [documents, totalCount] = await Promise.all([
    prisma.document.findMany({
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
          where: { status: "ACTIVE" },
          include: {
            flaggedByUser: {
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
        _count: {
          select: {
            flags: true,
          },
        },
      },
      orderBy: { uploaded_at: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.document.count({ where }),
  ]);

  const count = totalCount;

  // Get file type icon
  const getFileTypeIcon = (fileName: string, documentType?: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const mimeType = documentType?.toLowerCase() || "";

    if (mimeType.includes("image") || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return <Image className="h-4 w-4 text-blue-600" strokeWidth={2} />;
    }
    if (extension === "pdf" || mimeType.includes("pdf")) {
      return <FileText className="h-4 w-4 text-red-600" strokeWidth={2} />;
    }
    return <File className="h-4 w-4 text-gray-600" strokeWidth={2} />;
  };

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPLOADED":
        return (
          <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 font-medium">
            Uploaded
          </Badge>
        );
      case "FLAGGED":
        return (
          <Badge variant="destructive" className="text-xs px-2 py-0.5 h-5 font-medium">
            Flagged
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="success" className="text-xs px-2 py-0.5 h-5 font-medium">
            Accepted
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 font-medium">
            {status}
          </Badge>
        );
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Evidence Vault</h1>
          <p className="text-muted-foreground mt-1">
            Centralized, version-controlled repository for all compliance documents
          </p>
        </div>
        <Button asChild>
          <Link href="/institution/documents/upload">Upload Document</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {count} document{count !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentFilters currentParams={params} />

          {documents.length === 0 ? (
            <EmptyState
              title="No documents found"
              description="Upload your first document to get started. Documents are version-controlled and cannot be deleted."
              action={{
                label: "Upload Document",
                href: "/institution/documents/upload",
              }}
              icon={<FileUp className="h-6 w-6" strokeWidth={1.5} />}
              variant="no-results"
            />
          ) : (
            <ResponsiveTable>
              <Table>
              <TableHeader className="sticky top-0 bg-white z-10 border-b border-gray-200/60">
                <TableRow>
                  <TableHead className="w-[280px]">File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="w-[80px]">Version</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[90px]">Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead className="w-[110px]">Uploaded At</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const fileTypeIcon = getFileTypeIcon(doc.file_name, doc.document_type);
                  const fileExtension = doc.file_name.split(".").pop()?.toUpperCase() || "FILE";
                  const fileSize = formatFileSize(doc.file_size_bytes);
                  const uploadDate = doc.uploaded_at.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <TableRow key={doc.document_id}>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          {/* File Type Icon Chip */}
                          <div className="shrink-0">
                            <div
                              className={cn(
                                "flex items-center justify-center h-8 w-8 rounded-lg",
                                fileExtension === "PDF" && "bg-red-50",
                                ["JPG", "JPEG", "PNG", "GIF", "WEBP"].includes(fileExtension) && "bg-blue-50",
                                !["PDF", "JPG", "JPEG", "PNG", "GIF", "WEBP"].includes(fileExtension) && "bg-gray-100"
                              )}
                            >
                              {fileTypeIcon}
                            </div>
                          </div>
                          {/* File Name + Meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link
                                href={`/institution/documents/${doc.document_id}`}
                                className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate transition-colors duration-150"
                              >
                                {doc.file_name}
                              </Link>
                              {doc._count.flags > 0 && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4 font-medium shrink-0">
                                  {doc._count.flags}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-gray-500">{fileExtension}</span>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-xs text-gray-500">{fileSize}</span>
                              <span className="text-xs text-gray-300">•</span>
                              <span className="text-xs text-gray-500">{uploadDate}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{doc.document_type || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">{formatEntityType(doc.related_entity)}</span>
                          <span className="text-xs text-gray-500 truncate">
                            {doc.related_entity_id.substring(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 font-medium bg-gray-50 text-gray-700 border-gray-200">
                          v{doc.version}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{fileSize}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-900 truncate">
                            {doc.uploadedByUser.first_name && doc.uploadedByUser.last_name
                              ? `${doc.uploadedByUser.first_name} ${doc.uploadedByUser.last_name}`
                              : doc.uploadedByUser.email}
                          </span>
                          <span className="text-xs text-gray-500 truncate">{doc.uploadedByUser.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{uploadDate}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            asChild
                          >
                            <Link href={`/institution/documents/${doc.document_id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1.5 text-gray-600" strokeWidth={1.5} />
                              View
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" strokeWidth={1.5} />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem asChild>
                                <Link href={`/institution/documents/${doc.document_id}`} className="cursor-pointer">
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
