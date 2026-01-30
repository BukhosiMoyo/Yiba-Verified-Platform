/**
 * Verification Badge System
 * 
 * Badge Tiers:
 * - NONE: No verification
 * - BLUE: Standard verified (30 days, email, phone, profile complete)
 * - GREEN: Accredited institution (institution admin with approved readiness)
 * - GOLD: Government/QCTO (after 3 completed reviews)
 * - BLACK: Platform Admin
 * 
 * Fast-track option available for paid quick verification (skips 30-day wait)
 */

import { prisma } from "./prisma";

export type VerificationLevel = "NONE" | "BLUE" | "GREEN" | "GOLD" | "BLACK";

export interface VerificationStatus {
  level: VerificationLevel;
  progress: VerificationProgress;
  eligible: boolean;
  earnedAt?: Date;
}

export interface VerificationProgress {
  emailVerified: boolean;
  phoneVerified: boolean;
  profileComplete: boolean;
  profileCompleteness: number;
  accountAge: number; // days
  accountAgeRequired: number; // 30 days or 0 if fast-track
  noViolations: boolean;
  // Role-specific
  reviewsCompleted?: number; // For QCTO (need 3)
  reviewsRequired?: number;
  institutionAccredited?: boolean; // For institution admins
  institutionStaffAutoVerified?: boolean; // Staff of verified institution
  isQCTO?: boolean;
  isPlatformAdmin?: boolean;
  fastTrackEnabled?: boolean;
}

export interface VerificationRequirement {
  key: string;
  label: string;
  completed: boolean;
  description?: string;
  action?: string; // URL or action to complete
}

const ACCOUNT_AGE_REQUIRED_DAYS = 30;
const QCTO_REVIEWS_REQUIRED = 3;
const PROFILE_COMPLETENESS_THRESHOLD = 80;

/**
 * Calculate profile completeness percentage
 */
export function calculateProfileCompleteness(user: {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
}): number {
  const fields = [
    { value: user.first_name, weight: 20 },
    { value: user.last_name, weight: 20 },
    { value: user.email, weight: 20 },
    { value: user.phone, weight: 20 },
    { value: user.image, weight: 20 },
  ];

  const completed = fields.reduce((sum, field) => {
    return sum + (field.value ? field.weight : 0);
  }, 0);

  return completed;
}

/**
 * Get verification progress for a user
 */
export async function getVerificationProgress(userId: string): Promise<VerificationProgress> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check for institution accreditation separately if user has an institution
  let institutionAccredited = false;
  if (user.institution_id) {
    const readinessCount = await prisma.readiness.count({
      where: {
        institution_id: user.institution_id,
        readiness_status: "RECOMMENDED",
      },
    });
    institutionAccredited = readinessCount > 0;
  }

  const accountAgeDays = Math.floor(
    (Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24)
  );

  const profileCompleteness = calculateProfileCompleteness({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    image: user.image,
  });

  const isQCTORole = [
    "QCTO_USER",
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ].includes(user.role);

  const isPlatformAdmin = user.role === "PLATFORM_ADMIN";
  const isInstitutionAdmin = user.role === "INSTITUTION_ADMIN";
  const isInstitutionStaff = user.role === "INSTITUTION_STAFF";

  // Institution staff auto-verify if their institution is accredited
  const institutionStaffAutoVerified = isInstitutionStaff && institutionAccredited;

  return {
    emailVerified: !!user.emailVerified,
    phoneVerified: user.phone_verified,
    profileComplete: profileCompleteness >= PROFILE_COMPLETENESS_THRESHOLD,
    profileCompleteness,
    accountAge: accountAgeDays,
    accountAgeRequired: user.verification_fast_track ? 0 : ACCOUNT_AGE_REQUIRED_DAYS,
    noViolations: user.violation_count === 0,
    reviewsCompleted: isQCTORole ? user.reviews_completed : undefined,
    reviewsRequired: isQCTORole ? QCTO_REVIEWS_REQUIRED : undefined,
    institutionAccredited: isInstitutionAdmin ? institutionAccredited : undefined,
    institutionStaffAutoVerified,
    isQCTO: isQCTORole,
    isPlatformAdmin,
    fastTrackEnabled: user.verification_fast_track,
  };
}

/**
 * Calculate what verification level a user is eligible for
 */
export async function calculateVerificationLevel(userId: string): Promise<VerificationStatus> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const progress = await getVerificationProgress(userId);

  // Platform Admin always gets BLACK
  if (progress.isPlatformAdmin) {
    return {
      level: "BLACK",
      progress,
      eligible: true,
      earnedAt: user.verification_date ?? user.created_at,
    };
  }

  // QCTO roles - need 3 reviews for GOLD
  if (progress.isQCTO) {
    const hasBlueRequirements =
      progress.emailVerified &&
      progress.phoneVerified &&
      progress.profileComplete &&
      progress.noViolations &&
      (progress.fastTrackEnabled || progress.accountAge >= ACCOUNT_AGE_REQUIRED_DAYS);

    const hasGoldRequirements =
      hasBlueRequirements &&
      (progress.reviewsCompleted || 0) >= QCTO_REVIEWS_REQUIRED;

    if (hasGoldRequirements) {
      return {
        level: "GOLD",
        progress,
        eligible: true,
        earnedAt: user.verification_date ?? undefined,
      };
    }

    if (hasBlueRequirements) {
      return {
        level: "BLUE",
        progress,
        eligible: true,
        earnedAt: user.verification_date ?? undefined,
      };
    }

    return { level: "NONE", progress, eligible: false };
  }

  // Institution Admin - needs accredited institution for GREEN
  if (user.role === "INSTITUTION_ADMIN") {
    const hasBlueRequirements =
      progress.emailVerified &&
      progress.phoneVerified &&
      progress.profileComplete &&
      progress.noViolations &&
      (progress.fastTrackEnabled || progress.accountAge >= ACCOUNT_AGE_REQUIRED_DAYS);

    if (hasBlueRequirements && progress.institutionAccredited) {
      return {
        level: "GREEN",
        progress,
        eligible: true,
        earnedAt: user.verification_date ?? undefined,
      };
    }

    if (hasBlueRequirements) {
      return {
        level: "BLUE",
        progress,
        eligible: true,
        earnedAt: user.verification_date ?? undefined,
      };
    }

    return { level: "NONE", progress, eligible: false };
  }

  // Institution Staff - auto-verify if institution is accredited
  if (user.role === "INSTITUTION_STAFF" && progress.institutionStaffAutoVerified) {
    const hasBasicRequirements =
      progress.emailVerified &&
      progress.phoneVerified &&
      progress.profileComplete &&
      progress.noViolations;

    if (hasBasicRequirements) {
      return {
        level: "BLUE",
        progress,
        eligible: true,
        earnedAt: user.verification_date ?? undefined,
      };
    }
  }

  // Standard users (Students, Staff)
  const hasBlueRequirements =
    progress.emailVerified &&
    progress.phoneVerified &&
    progress.profileComplete &&
    progress.noViolations &&
    (progress.fastTrackEnabled || progress.accountAge >= ACCOUNT_AGE_REQUIRED_DAYS);

  if (hasBlueRequirements) {
    return {
      level: "BLUE",
      progress,
      eligible: true,
      earnedAt: user.verification_date ?? undefined,
    };
  }

  return { level: "NONE", progress, eligible: false };
}

/**
 * Get list of requirements for verification
 */
export function getVerificationRequirements(
  progress: VerificationProgress,
  targetLevel: VerificationLevel = "BLUE"
): VerificationRequirement[] {
  const requirements: VerificationRequirement[] = [];

  // Basic requirements for all
  requirements.push({
    key: "email",
    label: "Email verified",
    completed: progress.emailVerified,
    action: "/account/profile",
  });

  requirements.push({
    key: "phone",
    label: "Phone verified",
    completed: progress.phoneVerified,
    description: "Verify your phone number with OTP",
    action: "/account/security",
  });

  requirements.push({
    key: "profile",
    label: `Profile complete (${progress.profileCompleteness}%)`,
    completed: progress.profileComplete,
    description: `Need ${PROFILE_COMPLETENESS_THRESHOLD}% completion`,
    action: "/account/profile",
  });

  requirements.push({
    key: "violations",
    label: "No violations",
    completed: progress.noViolations,
  });

  // Account age (skip if fast-track)
  if (!progress.fastTrackEnabled) {
    requirements.push({
      key: "age",
      label: `Account age (${progress.accountAge}/${ACCOUNT_AGE_REQUIRED_DAYS} days)`,
      completed: progress.accountAge >= ACCOUNT_AGE_REQUIRED_DAYS,
      description: "Or enable fast-track verification",
    });
  }

  // QCTO-specific for GOLD
  if (progress.isQCTO && targetLevel === "GOLD") {
    requirements.push({
      key: "reviews",
      label: `Completed reviews (${progress.reviewsCompleted || 0}/${QCTO_REVIEWS_REQUIRED})`,
      completed: (progress.reviewsCompleted || 0) >= QCTO_REVIEWS_REQUIRED,
      description: "Complete readiness or submission reviews",
    });
  }

  // Institution Admin for GREEN
  if (progress.institutionAccredited !== undefined && targetLevel === "GREEN") {
    requirements.push({
      key: "accredited",
      label: "Institution accredited",
      completed: progress.institutionAccredited,
      description: "Your institution must have approved readiness",
    });
  }

  return requirements;
}

/**
 * Update user's verification level in database
 */
export async function updateVerificationLevel(userId: string): Promise<VerificationLevel> {
  const status = await calculateVerificationLevel(userId);

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { verification_level: true, verification_date: true },
  });

  // Only update if level changed
  if (user && user.verification_level !== status.level) {
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        verification_level: status.level,
        verification_date: status.level !== "NONE" ? new Date() : null,
      },
    });
  }

  return status.level;
}

/**
 * Increment reviews completed for QCTO users
 */
export async function incrementReviewsCompleted(userId: string): Promise<void> {
  await prisma.user.update({
    where: { user_id: userId },
    data: {
      reviews_completed: { increment: 1 },
    },
  });

  // Check if this triggers GOLD badge
  await updateVerificationLevel(userId);
}

/**
 * Enable fast-track verification (paid option)
 */
export async function enableFastTrackVerification(userId: string): Promise<void> {
  await prisma.user.update({
    where: { user_id: userId },
    data: { verification_fast_track: true },
  });

  // Recalculate verification level
  await updateVerificationLevel(userId);
}

/**
 * Badge configuration for display
 */
export const BADGE_CONFIG = {
  NONE: {
    color: "#9CA3AF",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-500 dark:text-gray-400",
    label: "Unverified",
    icon: null,
  },
  BLUE: {
    color: "#3B82F6",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
    label: "Verified",
    description: "Verified account in good standing",
  },
  GREEN: {
    color: "#10B981",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
    label: "Accredited",
    description: "Accredited institution representative",
  },
  GOLD: {
    color: "#F59E0B",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-600 dark:text-amber-400",
    label: "Official",
    description: "Government/QCTO official",
  },
  BLACK: {
    color: "#111827",
    bgColor: "bg-gray-900 dark:bg-gray-100",
    textColor: "text-white dark:text-gray-900",
    label: "Admin",
    description: "Yiba Verified administrator",
  },
};
