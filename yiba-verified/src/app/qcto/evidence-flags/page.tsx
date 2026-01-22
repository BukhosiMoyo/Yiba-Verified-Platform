import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { hasCap } from "@/lib/capabilities";
import { canAccessQctoData } from "@/lib/rbac";
import { authOptions } from "@/lib/auth";
import { EvidenceFlagsClient } from "./EvidenceFlagsClient";

/**
 * QCTO Evidence Flags Page
 *
 * Lists documents flagged by QCTO for attention.
 * - Requires EVIDENCE_VIEW
 * - QCTO_USER and PLATFORM_ADMIN can access
 */
export default async function QCTOEvidenceFlagsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  if (!canAccessQctoData(userRole)) {
    redirect("/unauthorized");
  }

  if (!hasCap(userRole, "EVIDENCE_VIEW")) {
    redirect("/unauthorized");
  }

  return <EvidenceFlagsClient userRole={userRole} />;
}
