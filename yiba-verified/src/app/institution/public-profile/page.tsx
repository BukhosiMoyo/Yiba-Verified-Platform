import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasCap } from "@/lib/capabilities";
import type { Role } from "@/lib/rbac";
import { PublicProfilePageClient } from "./PublicProfilePageClient";

export default async function InstitutionPublicProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null; // layout redirects unauthenticated users
  }
  const role = session.user.role as Role;
  const canManageProfile = hasCap(role, "CAN_MANAGE_PUBLIC_PROFILE");
  const canViewLeads = hasCap(role, "CAN_VIEW_LEADS");

  return (
    <PublicProfilePageClient
      canManageProfile={canManageProfile}
      canViewLeads={canViewLeads}
    />
  );
}
