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
 * - Users can only mark their own notifications as read
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { notificationId } = await params;

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

    // Users can only mark their own notifications as read
    // (PLATFORM_ADMIN could mark any, but we'll keep it scoped for security)
    if (notification.user_id !== ctx.userId && ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Cannot modify this notification", 403));
    }

    // Mark as read if not already read
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
