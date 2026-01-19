import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/platform-admin/announcements
 * 
 * Get all announcements (including archived) for admin management.
 * - Requires PLATFORM_ADMIN role
 * - Returns all announcements regardless of status
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    // Only PLATFORM_ADMIN can view all announcements
    if (ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins can view all announcements", 403));
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        deleted_at: null,
      },
      orderBy: [
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
        status: announcement.status,
        created_by: {
          name: `${announcement.createdByUser.first_name} ${announcement.createdByUser.last_name}`,
          email: announcement.createdByUser.email,
        },
        expires_at: announcement.expires_at?.toISOString() || null,
        created_at: announcement.created_at.toISOString(),
        updated_at: announcement.updated_at.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
