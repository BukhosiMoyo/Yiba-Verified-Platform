import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * PATCH /api/announcements/[announcementId]
 * 
 * Update an announcement (PLATFORM_ADMIN only).
 * - Can update status (ACTIVE/ARCHIVED), title, message, priority, expires_at
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { announcementId: string } }
) {
  try {
    const ctx = await requireApiContext(request);

    // Only PLATFORM_ADMIN can update announcements
    if (ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins can update announcements", 403));
    }

    const { announcementId } = params;
    const body = await request.json();

    const { title, message, priority, status, expires_at } = body;

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

    const announcement = await prisma.announcement.update({
      where: { announcement_id: announcementId },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      announcement_id: announcement.announcement_id,
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      status: announcement.status,
      created_by: {
        name: `${announcement.createdByUser.first_name} ${announcement.createdByUser.last_name}`,
        email: announcement.createdByUser.email,
      },
      expires_at: announcement.expires_at?.toISOString() || null,
      created_at: announcement.created_at.toISOString(),
      updated_at: announcement.updated_at.toISOString(),
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
 * Soft delete an announcement (PLATFORM_ADMIN only).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { announcementId: string } }
) {
  try {
    const ctx = await requireApiContext(request);

    // Only PLATFORM_ADMIN can delete announcements
    if (ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins can delete announcements", 403));
    }

    const { announcementId } = params;

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
