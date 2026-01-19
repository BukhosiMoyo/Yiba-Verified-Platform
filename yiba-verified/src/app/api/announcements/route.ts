import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/announcements
 * 
 * Get active announcements visible to all users.
 * - Returns only ACTIVE announcements that haven't expired
 * - Ordered by priority (URGENT > HIGH > MEDIUM > LOW) then created_at
 * - No authentication required (announcements are public)
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        status: "ACTIVE",
        deleted_at: null,
        OR: [
          { expires_at: null },
          { expires_at: { gt: now } },
        ],
      },
      orderBy: [
        { priority: "desc" }, // URGENT > HIGH > MEDIUM > LOW
        { created_at: "desc" },
      ],
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
      items: announcements.map((announcement) => ({
        announcement_id: announcement.announcement_id,
        title: announcement.title,
        message: announcement.message,
        priority: announcement.priority,
        created_by: {
          name: `${announcement.createdByUser.first_name} ${announcement.createdByUser.last_name}`,
          email: announcement.createdByUser.email,
        },
        expires_at: announcement.expires_at?.toISOString() || null,
        created_at: announcement.created_at.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/announcements
 * 
 * Create a new announcement (PLATFORM_ADMIN only).
 * - Requires PLATFORM_ADMIN role
 * - Creates announcement visible to all users
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    // Only PLATFORM_ADMIN can create announcements
    if (ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins can create announcements", 403));
    }

    const body = await request.json();
    const { title, message, priority = "MEDIUM", expires_at } = body;

    // Validate required fields
    if (!title || !message) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "title and message are required", 400));
    }

    // Validate priority
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    if (priority && !validPriorities.includes(priority)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid priority: ${priority}`, 400));
    }

    // Parse expires_at if provided
    let expiresAtDate: Date | null = null;
    if (expires_at) {
      expiresAtDate = new Date(expires_at);
      if (isNaN(expiresAtDate.getTime())) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid expires_at date format", 400));
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        priority: priority || "MEDIUM",
        created_by: ctx.userId,
        expires_at: expiresAtDate,
      },
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

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
