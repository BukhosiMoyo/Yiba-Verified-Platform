import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCap } from "@/lib/capabilities";
import type { Role } from "@/lib/rbac";
import { InstitutionProfileClient } from "./InstitutionProfileClient";

/**
 * Institution Profile Page
 *
 * Displays the current user's institution details with edit capability for authorized users.
 * - INSTITUTION_ADMIN: can view and edit (has INSTITUTION_PROFILE_EDIT capability)
 * - INSTITUTION_STAFF: can view only (read-only)
 * - PLATFORM_ADMIN: can view and edit
 */
export default async function InstitutionProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userInstitutionId = session.user.institutionId;

  if (!userInstitutionId) {
    redirect("/unauthorized");
  }

  const role = session.user.role as Role;
  const canEdit = role === "PLATFORM_ADMIN" || hasCap(role, "INSTITUTION_PROFILE_EDIT");

  return <InstitutionProfileClient canEdit={canEdit} />;
}
