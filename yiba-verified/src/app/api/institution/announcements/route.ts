import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { formatRoleForDisplay } from "@/lib/announcements";

/**
 * GET /api/institution/announcements
 * 
 * Get all announcements for an institution admin (including their own institution's announcements).
 * - Requires INSTITUTION_ADMIN role
 * - Returns all announcements for their institution (including archived)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    // Only INSTITUTION_ADMIN can view their institution's announcements
    if (ctx.role !== "INSTITUTION_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only institution admins can view institution announcements", 403));
    }

    // Get user's institution
    const user = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: { institution_id: true },
    });

    if (!user?.institution_id) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "User is not associated with an institution", 400));
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        deleted_at: null,
        institution_id: user.institution_id, // Only show announcements for this institution
      },
      orderBy: [
        { created_at: "desc" },
      ],
      include: {
        createdByUser: {
          select: {
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
          name: announcement.created_by_name,
          role: formatRoleForDisplay(announcement.created_by_role),
          email: announcement.createdByUser?.email || "",
        },
        target_roles: announcement.target_roles || [],
        institution_id: announcement.institution_id || null,
        expires_at: announcement.expires_at?.toISOString() || null,
        created_at: announcement.created_at.toISOString(),
        updated_at: announcement.updated_at.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
