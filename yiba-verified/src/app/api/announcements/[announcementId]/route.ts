import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { formatRoleForDisplay } from "@/lib/announcements";

/**
 * PATCH /api/announcements/[announcementId]
 * 
 * Update an announcement.
 * - PLATFORM_ADMIN/QCTO_SUPER_ADMIN: Can update any announcement
 * - INSTITUTION_ADMIN: Can only update their own institution's announcements
 * - Can update status (ACTIVE/ARCHIVED), title, message, priority, expires_at, target_roles
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const ctx = await requireApiContext(request);

    // Check permissions - only QCTO_SUPER_ADMIN can manage announcements (not regular QCTO_ADMIN)
    const canUpdateAny = ctx.role === "PLATFORM_ADMIN" || ctx.role === "QCTO_SUPER_ADMIN";
    const canUpdateOwn = ctx.role === "INSTITUTION_ADMIN";
    
    if (!canUpdateAny && !canUpdateOwn) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins, QCTO super admins, and institution admins can update announcements", 403));
    }

    const { announcementId } = await params;
    const body = await request.json();

    const { title, message, priority, status, expires_at, target_roles } = body;

    // Build update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (message !== undefined) updateData.message = message.trim();
    if (priority !== undefined) {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
      if (!validPriorities.includes(priority)) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid priority: ${priority}`, 400));
      }
      updateData.priority = priority;
    }
    if (status !== undefined) {
      const validStatuses = ["ACTIVE", "ARCHIVED"];
      if (!validStatuses.includes(status)) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid status: ${status}`, 400));
      }
      updateData.status = status;
    }
    if (expires_at !== undefined) {
      if (expires_at === null) {
        updateData.expires_at = null;
      } else {
        const expiresAtDate = new Date(expires_at);
        if (isNaN(expiresAtDate.getTime())) {
          return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid expires_at date format", 400));
        }
        updateData.expires_at = expiresAtDate;
      }
    }
    if (target_roles !== undefined) {
      const { ANNOUNCEMENT_TARGET_ROLES } = await import("@/lib/announcements");
      const validRoles = ANNOUNCEMENT_TARGET_ROLES.map((r) => r.value);
      if (!Array.isArray(target_roles)) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "target_roles must be an array", 400));
      }
      const validTargetRoles = target_roles.filter((r: string) => (validRoles as readonly string[]).includes(r));
      if (validTargetRoles.length !== target_roles.length) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid role(s) in target_roles", 400));
      }
      
      // Institution admins can only target STUDENT and INSTITUTION_STAFF
      if (canUpdateOwn && !canUpdateAny) {
        const allowedRoles = ["STUDENT", "INSTITUTION_STAFF"];
        const invalidRoles = validTargetRoles.filter((r) => !allowedRoles.includes(r));
        if (invalidRoles.length > 0) {
          return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Institution admins can only target Students and Institution Staff, not: ${invalidRoles.join(", ")}`, 400));
        }
      }
      
      updateData.target_roles = validTargetRoles;
    }

    const announcement = await prisma.announcement.findUnique({
      where: { announcement_id: announcementId },
      include: {
        createdByUser: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!announcement) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Announcement not found", 404));
    }

    const updated = await prisma.announcement.update({
      where: { announcement_id: announcementId },
      data: updateData,
    });

    return NextResponse.json({
      announcement_id: updated.announcement_id,
      title: updated.title,
      message: updated.message,
      priority: updated.priority,
      status: updated.status,
      created_by: {
        name: updated.created_by_name, // Use stored name (historical accuracy)
        role: formatRoleForDisplay(updated.created_by_role), // Show role
        email: announcement.createdByUser?.email || "",
      },
      target_roles: updated.target_roles || [],
      institution_id: updated.institution_id || null,
      expires_at: updated.expires_at?.toISOString() || null,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Announcement not found", 404));
    }
    return fail(error);
  }
}

/**
 * DELETE /api/announcements/[announcementId]
 * 
 * Soft delete an announcement.
 * - PLATFORM_ADMIN/QCTO_SUPER_ADMIN: Can delete any announcement
 * - INSTITUTION_ADMIN: Can only delete their own institution's announcements
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const ctx = await requireApiContext(request);

    // Check permissions - only QCTO_SUPER_ADMIN can manage announcements (not regular QCTO_ADMIN)
    const canDeleteAny = ctx.role === "PLATFORM_ADMIN" || ctx.role === "QCTO_SUPER_ADMIN";
    const canDeleteOwn = ctx.role === "INSTITUTION_ADMIN";
    
    if (!canDeleteAny && !canDeleteOwn) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins, QCTO super admins, and institution admins can delete announcements", 403));
    }

    const { announcementId } = await params;

    // Check if institution admin can delete this announcement
    if (canDeleteOwn && !canDeleteAny) {
      const announcement = await prisma.announcement.findUnique({
        where: { announcement_id: announcementId },
        select: { institution_id: true },
      });

      if (!announcement) {
        return fail(new AppError(ERROR_CODES.NOT_FOUND, "Announcement not found", 404));
      }

      const user = await prisma.user.findUnique({
        where: { user_id: ctx.userId },
        select: { institution_id: true },
      });
      
      if (!user?.institution_id || announcement.institution_id !== user.institution_id) {
        return fail(new AppError(ERROR_CODES.FORBIDDEN, "Institution admins can only delete announcements for their own institution", 403));
      }
    }

    await prisma.announcement.update({
      where: { announcement_id: announcementId },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Announcement not found", 404));
    }
    return fail(error);
  }
}
