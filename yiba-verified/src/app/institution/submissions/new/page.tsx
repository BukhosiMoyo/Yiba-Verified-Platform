import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateSubmissionForm } from "@/components/institution/CreateSubmissionForm";

/**
 * Create New Submission Page
 * 
 * Server Component that displays the form for creating a new submission.
 * - Enforces institution scoping (already handled by layout)
 */
export default async function NewSubmissionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create Submission</h1>
        <p className="text-muted-foreground mt-2">
          Create a new compliance pack, readiness report, or other submission for QCTO
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Submission</CardTitle>
          <CardDescription>
            Create a new submission and optionally add resources immediately
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateSubmissionForm />
        </CardContent>
      </Card>
    </div>
  );
}
