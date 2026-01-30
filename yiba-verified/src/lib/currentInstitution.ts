// Resolve "current institution" and list of institutions for a user (multi-institution support).
import { prisma } from "@/lib/prisma";

export type InstitutionDisplay = {
  institution_id: string;
  legal_name: string;
  branch_code: string | null;
  registration_number: string;
};

export type CurrentInstitutionResult = {
  currentInstitutionId: string | null;
  institutionIds: string[];
  institutions: InstitutionDisplay[];
};

/**
 * Get the current institution and all institutions for a user.
 * Used for INSTITUTION_ADMIN and INSTITUTION_STAFF with multiple institutions.
 *
 * Resolution order for current institution:
 * 1. preferredIdFromCookie if it is in the user's institution list
 * 2. Primary institution (is_primary: true)
 * 3. First by created_at
 *
 * If the user has no UserInstitution rows, falls back to User.institution_id (backward compatibility).
 * If prisma.userInstitution is missing (e.g. client not regenerated), uses legacy path only.
 */
export async function getCurrentInstitutionForUser(
  userId: string,
  preferredIdFromCookie?: string | null
): Promise<CurrentInstitutionResult> {
  const delegate = (prisma as { userInstitution?: { findMany: (args: unknown) => Promise<unknown[]> } }).userInstitution;
  let userInstitutions: Array<{
    institution_id: string;
    is_primary: boolean;
    institution: { institution_id: string; legal_name: string; branch_code: string | null; registration_number: string };
  }> = [];

  if (delegate?.findMany) {
    try {
      const rows = await delegate.findMany({
        where: { user_id: userId },
        include: {
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              branch_code: true,
              registration_number: true,
            },
          },
        },
        orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
      });
      userInstitutions = rows as typeof userInstitutions;
    } catch {
      userInstitutions = [];
    }
  }

  if (userInstitutions.length === 0) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { institution_id: true },
    });
    const legacyId = user?.institution_id ?? null;
    if (legacyId) {
      const inst = await prisma.institution.findUnique({
        where: { institution_id: legacyId },
        select: {
          institution_id: true,
          legal_name: true,
          branch_code: true,
          registration_number: true,
        },
      });
      return {
        currentInstitutionId: legacyId,
        institutionIds: [legacyId],
        institutions: inst ? [inst] : [],
      };
    }
    return {
      currentInstitutionId: null,
      institutionIds: [],
      institutions: [],
    };
  }

  const institutionIds = userInstitutions.map((ui) => ui.institution_id);
  const institutions: InstitutionDisplay[] = userInstitutions.map((ui) => ({
    institution_id: ui.institution.institution_id,
    legal_name: ui.institution.legal_name,
    branch_code: ui.institution.branch_code,
    registration_number: ui.institution.registration_number,
  }));

  const primary = userInstitutions.find((ui) => ui.is_primary);
  const firstId = institutionIds[0] ?? null;
  const preferredValid =
    preferredIdFromCookie && institutionIds.includes(preferredIdFromCookie);

  const currentInstitutionId = preferredValid
    ? preferredIdFromCookie!
    : (primary?.institution_id ?? firstId);

  return {
    currentInstitutionId,
    institutionIds,
    institutions,
  };
}
