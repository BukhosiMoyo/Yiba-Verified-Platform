/**
 * Server-side utilities for View As User
 * Used in layouts to get View As User information
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";

export interface ViewAsUserInfo {
  viewingAsUserId: string | null;
  viewingAsRole: Role | null;
  viewingAsUserName: string | null;
  originalUserId: string;
  originalRole: Role;
  originalUserName: string;
}

/**
 * Get View As User information from cookies and session
 * Returns null if not viewing as another user
 */
export async function getViewAsUserInfo(
  sessionUserId: string,
  sessionRole: Role,
  sessionUserName: string
): Promise<ViewAsUserInfo | null> {
  const cookieStore = await cookies();
  const viewingAsUserId = cookieStore.get("viewing_as_user_id")?.value;
  const viewingAsRole = cookieStore.get("viewing_as_role")?.value as Role | undefined;

  if (!viewingAsUserId || !viewingAsRole) {
    return null; // Not viewing as another user
  }

  // Get viewing as user's name
  const viewingAsUser = await prisma.user.findUnique({
    where: { user_id: viewingAsUserId },
    select: {
      first_name: true,
      last_name: true,
    },
  });

  const viewingAsUserName = viewingAsUser
    ? `${viewingAsUser.first_name} ${viewingAsUser.last_name}`
    : "Unknown User";

  return {
    viewingAsUserId,
    viewingAsRole,
    viewingAsUserName,
    originalUserId: sessionUserId,
    originalRole: sessionRole,
    originalUserName: sessionUserName,
  };
}
