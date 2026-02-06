/**
 * Compute facilitator profile completeness for a user (required fields + required documents).
 * Used to determine if a user can be selected as facilitator in Form 5.
 */

import { prisma } from "@/lib/prisma";

export const FACILITATOR_PROFILE_REQUIRED_DOC_TYPES = ["FACILITATOR_CV", "FACILITATOR_CONTRACT"] as const;

export async function computeFacilitatorProfileCompleteness(userId: string): Promise<{
  complete: boolean;
  percentage: number;
  hasRequiredFields: boolean;
  hasRequiredDocs: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      facilitator_id_number: true,
      facilitator_qualifications: true,
      facilitator_industry_experience: true,
      documents: {
        select: { document_type: true },
      },
    },
  });

  if (!user) {
    return { complete: false, percentage: 0, hasRequiredFields: false, hasRequiredDocs: false };
  }

  const hasIdNumber = !!user.facilitator_id_number?.trim();
  const hasQualifications = !!user.facilitator_qualifications?.trim();
  const hasIndustryExperience = !!user.facilitator_industry_experience?.trim();
  const hasRequiredFields = hasIdNumber && hasQualifications && hasIndustryExperience;

  const docTypes = new Set(user.documents.map((d) => d.document_type));
  const hasCv = docTypes.has("FACILITATOR_CV") || docTypes.has("CV");
  const hasContract = docTypes.has("FACILITATOR_CONTRACT") || docTypes.has("CONTRACT");
  const hasRequiredDocs = hasCv && hasContract;

  const complete = hasRequiredFields && hasRequiredDocs;

  const fieldScore = [hasIdNumber, hasQualifications, hasIndustryExperience].filter(Boolean).length;
  const docScore = [hasCv, hasContract].filter(Boolean).length;
  const total = 5;
  const filled = fieldScore + docScore;
  const percentage = Math.round((filled / total) * 100);

  return {
    complete,
    percentage,
    hasRequiredFields,
    hasRequiredDocs,
  };
}
