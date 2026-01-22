import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmptyState } from "@/components/shared/EmptyState";
import { Award } from "lucide-react";

/**
 * Student certificates: placeholder until a Certificate model/feature exists.
 * Requires STUDENT role (enforced by layout).
 */
export default async function StudentCertificatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Certificates</h1>
        <p className="text-muted-foreground mt-2">
          Qualifications you have completed
        </p>
      </div>

      <EmptyState
        title="No certificates yet"
        description="Certificates will appear here when you complete a qualification and your institution issues them. If you believe you should have a certificate, please contact your institution."
        icon={<Award className="h-6 w-6" strokeWidth={1.5} />}
      />
    </div>
  );
}
