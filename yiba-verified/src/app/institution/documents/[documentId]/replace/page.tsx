import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentReplaceForm } from "@/components/institution/DocumentReplaceForm";

interface PageProps {
  params: Promise<{
    documentId: string;
  }>;
}

/**
 * Institution Document Replace Page
 * 
 * Server Component that displays the document replace form.
 * - Only accessible to INSTITUTION_* roles
 */
export default async function InstitutionDocumentReplacePage({ params }: PageProps) {
  const { documentId } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Only INSTITUTION_* roles can replace documents
  if (userRole !== "INSTITUTION_ADMIN" && userRole !== "INSTITUTION_STAFF") {
    redirect("/unauthorized");
  }

  // Verify document exists and belongs to institution
  const where: any = {
    document_id: documentId,
  };

  if (userInstitutionId) {
    where.OR = [
      { related_entity: "INSTITUTION", related_entity_id: userInstitutionId },
      { related_entity: "LEARNER", learner: { institution_id: userInstitutionId } },
      { related_entity: "ENROLMENT", enrolment: { institution_id: userInstitutionId } },
      { related_entity: "READINESS", readiness: { institution_id: userInstitutionId } },
    ];
  }

  const document = await prisma.document.findFirst({
    where,
  });

  if (!document) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Replace Document</h1>
        <p className="text-muted-foreground mt-1">
          Upload a new version of: {document.file_name}
        </p>
      </div>

      <DocumentReplaceForm documentId={documentId} />
    </div>
  );
}
