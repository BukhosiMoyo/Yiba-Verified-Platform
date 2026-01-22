import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { formatRoleForDisplay } from "@/lib/announcements";

/**
 * GET /api/platform-admin/announcements
 * 
 * Get all announcements (including archived) for admin management.
 * - Requires PLATFORM_ADMIN or QCTO role
 * - Returns all announcements regardless of status
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    // Only PLATFORM_ADMIN or QCTO roles can view all announcements
    const QCTO_ROLES = [
      "QCTO_USER",
      "QCTO_SUPER_ADMIN",
      "QCTO_ADMIN",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];
    const canView = ctx.role === "PLATFORM_ADMIN" || QCTO_ROLES.includes(ctx.role);
    
    if (!canView) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins and QCTO users can view all announcements", 403));
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
          name: announcement.created_by_name, // Use stored name (historical accuracy)
          role: formatRoleForDisplay(announcement.created_by_role), // Show role
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
