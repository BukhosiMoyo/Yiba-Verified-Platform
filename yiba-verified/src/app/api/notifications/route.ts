import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/notifications
 * 
 * Get notifications for the current user.
 * - Returns notifications scoped to the authenticated user
 * - Supports filtering by read/unread status
 * 
 * Query params:
 * - is_read: 'true' | 'false' (filter by read status)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    const searchParams = request.nextUrl.searchParams;

    // Build where clause - always scope to current user (never from input; prevents cross-account leakage)
    const where: { user_id: string; is_read?: boolean } = {
      user_id: ctx.userId,
    };

    // Filter by read status if provided
    const isReadParam = searchParams.get("is_read");
    if (isReadParam === "true") {
      where.is_read = true;
    } else if (isReadParam === "false") {
      where.is_read = false;
    }

    // Pagination
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { user_id: ctx.userId, is_read: false },
      }),
    ]);

    return NextResponse.json({
      count: totalCount,
      unread_count: unreadCount,
      items: notifications.map((notification) => ({
        notification_id: notification.notification_id,
        notification_type: notification.notification_type,
        title: notification.title,
        message: notification.message,
        entity_type: notification.entity_type,
        entity_id: notification.entity_id,
        is_read: notification.is_read,
        read_at: notification.read_at?.toISOString() || null,
        created_at: notification.created_at.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/notifications
 * 
 * Create a notification (internal use, typically called by system events).
 * For now, this is only used internally. In the future, could allow admin/automated creation.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const body = await request.json();

    const { user_id, notification_type, title, message, entity_type, entity_id } = body;

    // Validate required fields
    if (!user_id || !notification_type || !title || !message) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "user_id, notification_type, title, and message are required", 400));
    }

    // Only PLATFORM_ADMIN can create notifications for other users
    // Regular users can only create notifications for themselves (for future use)
    if (user_id !== ctx.userId && ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Cannot create notifications for other users", 403));
    }

    // Validate notification type
    const validTypes = [
      "SUBMISSION_REVIEWED",
      "SUBMISSION_APPROVED",
      "SUBMISSION_REJECTED",
      "REQUEST_APPROVED",
      "REQUEST_REJECTED",
      "READINESS_REVIEWED",
      "READINESS_RECOMMENDED",
      "READINESS_REJECTED",
      "DOCUMENT_FLAGGED",
      "SYSTEM_ALERT",
      "ISSUE_RESPONSE",
      "INVITE_ACCEPTED",
      "READINESS_SUBMITTED",
      "REVIEW_ASSIGNED",
      "BULK_INVITE_COMPLETED",
      "INSTITUTION_CREATED",
    ];

    if (!validTypes.includes(notification_type)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid notification_type: ${notification_type}`, 400));
    }

    const notification = await prisma.notification.create({
      data: {
        user_id,
        notification_type,
        title,
        message,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
      },
    });

    return NextResponse.json(
      {
        notification_id: notification.notification_id,
        notification_type: notification.notification_type,
        title: notification.title,
        message: notification.message,
        entity_type: notification.entity_type,
        entity_id: notification.entity_id,
        is_read: notification.is_read,
        created_at: notification.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/notifications
 *
 * Mark all notifications for the current user as read (batch).
 * Body: { mark_all_read?: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const body = await request.json().catch(() => ({}));
    if (body?.mark_all_read !== true) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Body must include { mark_all_read: true }", 400));
    }

    await prisma.notification.updateMany({
      where: { user_id: ctx.userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });

    return NextResponse.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    return fail(error);
  }
}
