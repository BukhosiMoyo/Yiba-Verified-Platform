import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

interface RouteParams {
  params: Promise<{
    notificationId: string;
  }>;
}

/**
 * PATCH /api/notifications/[notificationId]
 *
 * Mark a notification as read.
 * Scoping: never return or modify another user's notification; only own (or PLATFORM_ADMIN for support).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { notificationId } = await params;
    const body = await request.json().catch(() => null);

    // Find notification and verify it belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { notification_id: notificationId },
      select: {
        notification_id: true,
        user_id: true,
        is_read: true,
      },
    });

    if (!notification) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Notification not found", 404));
    }

    // Check authorization
    if (notification.user_id !== ctx.userId && ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Cannot modify this notification", 403));
    }

    // Handle Restore
    if (body?.restored) {
      await prisma.notification.update({
        where: { notification_id: notificationId },
        data: { deleted_at: null },
      });
      return NextResponse.json({ message: "Notification restored" });
    }

    // Handle Mark Read (default behavior if no specific action provided, or if mark_read specified)
    if (!notification.is_read) {
      await prisma.notification.update({
        where: { notification_id: notificationId },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });
    }

    return NextResponse.json({
      notification_id: notification.notification_id,
      is_read: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * DELETE /api/notifications/[notificationId]
 * 
 * Archive (soft-delete) a single notification.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { notificationId } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { notification_id: notificationId },
      select: {
        notification_id: true,
        user_id: true,
        deleted_at: true,
      },
    });

    if (!notification) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Notification not found", 404));
    }

    if (notification.user_id !== ctx.userId && ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Cannot delete this notification", 403));
    }

    if (permanent) {
      await prisma.notification.delete({
        where: { notification_id: notificationId },
      });
      return NextResponse.json({ message: "Notification deleted permanently" });
    } else {
      // Soft delete (Archive)
      await prisma.notification.update({
        where: { notification_id: notificationId },
        data: {
          deleted_at: new Date(),
        },
      });
      return NextResponse.json({ message: "Notification archived" });
    }
  } catch (error) {
    return fail(error);
  }
}
