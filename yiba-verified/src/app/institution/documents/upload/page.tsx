import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadForm } from "@/components/institution/DocumentUploadForm";

/**
 * Institution Document Upload Page
 * 
 * Server Component that displays the document upload form.
 * - Only accessible to INSTITUTION_* roles (enforced by layout)
 */
export default async function InstitutionDocumentUploadPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  // Only INSTITUTION_* roles can upload documents (layout enforces this, but double-check)
  if (userRole !== "INSTITUTION_ADMIN" && userRole !== "INSTITUTION_STAFF") {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Document</h1>
        <p className="text-muted-foreground mt-1">
          Add a new document to the Evidence Vault
        </p>
      </div>

      <DocumentUploadForm />
    </div>
  );
}
