// GET/PATCH /api/student/profile/public - Manage public profile settings

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { generatePublicProfileId } from "@/lib/public-profile";

/**
 * GET /api/student/profile/public
 * Get current public profile settings for the authenticated student.
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Only STUDENT role can access this endpoint
    if (ctx.role !== "STUDENT") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only students can access public profile settings", 403);
    }

    // Get learner record
    const learner = await prisma.learner.findFirst({
      where: { user_id: ctx.userId, deleted_at: null },
      select: {
        learner_id: true,
        public_profile_id: true,
        public_profile_enabled: true,
        public_bio: true,
        public_skills: true,
        public_projects: true,
      },
    });

    if (!learner) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Learner profile not found", 404);
    }

    return ok({
      public_profile_id: learner.public_profile_id,
      public_profile_enabled: learner.public_profile_enabled,
      public_bio: learner.public_bio || "",
      public_skills: learner.public_skills || [],
      public_projects: (learner.public_projects as Array<{ id: string; title: string; description: string; link?: string }>) || [],
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/student/profile/public
 * Update public profile settings for the authenticated student.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Only STUDENT role can access this endpoint
    if (ctx.role !== "STUDENT") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only students can update public profile settings", 403);
    }

    const body = await request.json();
    const {
      public_profile_enabled,
      public_bio,
      public_skills,
      public_projects,
      generate_new_id, // If true, generate a new public_profile_id
    } = body;

    // Get learner record
    const learner = await prisma.learner.findFirst({
      where: { user_id: ctx.userId, deleted_at: null },
      select: { learner_id: true, public_profile_id: true },
    });

    if (!learner) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Learner profile not found", 404);
    }

    // Build update data
    const updateData: any = {};

    if (typeof public_profile_enabled === "boolean") {
      updateData.public_profile_enabled = public_profile_enabled;
      
      // If enabling and no public_profile_id exists, generate one
      if (public_profile_enabled && !learner.public_profile_id) {
        updateData.public_profile_id = generatePublicProfileId();
      }
    }

    // Generate new ID if requested
    if (generate_new_id === true) {
      updateData.public_profile_id = generatePublicProfileId();
    }

    if (typeof public_bio === "string") {
      updateData.public_bio = public_bio.trim() || null;
    }

    if (Array.isArray(public_skills)) {
      // Validate skills array
      const validSkills = public_skills
        .filter((s) => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim());
      updateData.public_skills = validSkills;
    }

    if (Array.isArray(public_projects)) {
      // Validate projects array
      const validProjects = public_projects
        .filter((p) => p && typeof p.title === "string" && p.title.trim().length > 0)
        .map((p) => ({
          id: p.id || `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: p.title.trim(),
          description: typeof p.description === "string" ? p.description.trim() : "",
          link: typeof p.link === "string" && p.link.trim() ? p.link.trim() : undefined,
        }));
      updateData.public_projects = validProjects;
    }

    // Update learner
    const updated = await prisma.learner.update({
      where: { learner_id: learner.learner_id },
      data: updateData,
      select: {
        public_profile_id: true,
        public_profile_enabled: true,
        public_bio: true,
        public_skills: true,
        public_projects: true,
      },
    });

    return ok({
      public_profile_id: updated.public_profile_id,
      public_profile_enabled: updated.public_profile_enabled,
      public_bio: updated.public_bio || "",
      public_skills: updated.public_skills || [],
      public_projects: (updated.public_projects as Array<{ id: string; title: string; description: string; link?: string }>) || [],
    });
  } catch (error) {
    return fail(error);
  }
}
