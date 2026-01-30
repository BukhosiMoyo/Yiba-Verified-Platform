import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreateReadinessForm } from "@/components/institution/CreateReadinessForm";

/**
 * Institution Create Readiness Page
 * 
 * Server Component that displays the form for creating a new readiness record.
 */
export default async function CreateReadinessPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  // Only INSTITUTION_* roles and PLATFORM_ADMIN can create readiness records
  if (userRole !== "INSTITUTION_ADMIN" && userRole !== "INSTITUTION_STAFF" && userRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-[60vh] p-4 md:p-8">
      <div className="max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create Form 5 Readiness Record</h1>
        <p className="text-muted-foreground mt-2">
          Start a new programme delivery readiness record for QCTO review. You can save progress and continue later.
        </p>
      </div>

      <CreateReadinessForm />
    </div>
  );
}
