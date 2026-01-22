/**
 * Type definitions for student profile data structures.
 * 
 * @deprecated The mock data functions have been removed. Public profile now uses real database queries.
 * These types are kept for backward compatibility and shared type definitions.
 */

export type PublicProfileEditable = {
  photoUrl: string | null;
  bio: string;
  skills: string[];
  projects: { id: string; title: string; description: string; link?: string }[];
};

export type PublicProfileSystem = {
  header: { name: string; verifiedBy: string; institutions: { name: string; studentId?: string }[] };
  qualifications: { title: string; nqf: string; status: string }[];
  workplaceEvidence: { total: number; recent: { workplace: string; role: string; range: string }[] };
};

export type PublicProfileData = {
  editable: PublicProfileEditable;
  system: PublicProfileSystem;
  targetRole: string;
  publicProfile: boolean;
  hideContact: boolean;
};

/**
 * @deprecated This function is no longer used. Public profiles now use real database queries.
 * See /app/p/[id]/page.tsx for the current implementation.
 * 
 * This function is kept for backward compatibility only and will be removed in a future version.
 */
export function getPublicProfile(id: string): PublicProfileData | null {
  console.warn("getPublicProfile() is deprecated. Public profiles now use real database queries.");
  return null;
}

/**
 * @deprecated This constant is no longer used. Public profile links now use learner_id (UUID).
 * This is kept for backward compatibility only and will be removed in a future version.
 */
export const PUBLIC_PROFILE_DEMO_ID = "demo";
