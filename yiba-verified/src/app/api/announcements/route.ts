import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { formatRoleForDisplay, ANNOUNCEMENT_TARGET_ROLES } from "@/lib/announcements";

/**
 * GET /api/announcements
 * 
 * Get active announcements visible to the current user (or all if not authenticated).
 * - Returns only ACTIVE announcements that haven't expired
 * - Filters by target_roles (empty array = visible to all)
 * - Ordered by priority (URGENT > HIGH > MEDIUM > LOW) then created_at
 * - No authentication required (but role filtering happens if user is authenticated)
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    // Try to get user info for filtering (optional - announcements are public)
    let userRole: string | null = null;
    let userInstitutionId: string | null = null;
    try {
      const ctx = await requireApiContext(request);
      userRole = ctx.role;
      
      // Get user's institution_id for institution-scoped filtering
      const user = await prisma.user.findUnique({
        where: { user_id: ctx.userId },
        select: { institution_id: true },
      });
      userInstitutionId = user?.institution_id || null;
    } catch {
      // Not authenticated - show announcements with empty target_roles (visible to all)
    }

    // Build the where clause based on user authentication and role
    const whereClause: any = {
      status: "ACTIVE",
      deleted_at: null,
      AND: [
        {
          OR: [
            { expires_at: null },
            { expires_at: { gt: now } },
          ],
        },
      ],
    };

    // Add institution and target_roles filtering
    if (userInstitutionId) {
      // Authenticated user with institution
      whereClause.AND.push({
        OR: [
          { institution_id: null }, // Platform-wide announcements
          { institution_id: userInstitutionId }, // User's institution announcements
        ],
      });

      // For students and institution staff, filter by target_roles
      if (userRole === "STUDENT" || userRole === "INSTITUTION_STAFF") {
        whereClause.AND.push({
          OR: [
            { target_roles: { isEmpty: true } }, // Visible to all
            { target_roles: { has: userRole } }, // Visible to user's role
          ],
        });
      }
      // Institution admins see all their institution's announcements (no target_roles filter)
    } else if (userRole) {
      // Authenticated user without institution (platform admin, QCTO, etc.)
      whereClause.AND.push({
        OR: [
          { target_roles: { isEmpty: true } }, // Visible to all
          { target_roles: { has: userRole } }, // Visible to user's role
        ],
      });
      whereClause.AND.push({ institution_id: null }); // Only platform-wide for non-institution users
    } else {
      // Not authenticated: only show platform-wide announcements with no target_roles
      whereClause.AND.push({ target_roles: { isEmpty: true } });
      whereClause.AND.push({ institution_id: null });
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: [
        { priority: "desc" }, // URGENT > HIGH > MEDIUM > LOW
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
        created_by: {
          name: announcement.created_by_name, // Use stored name (historical accuracy)
          role: formatRoleForDisplay(announcement.created_by_role), // Show role instead of just name
          email: announcement.createdByUser?.email || "",
        },
        target_roles: announcement.target_roles || [],
        institution_id: announcement.institution_id || null, // Institution-scoped or null for platform-wide
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
 * Create a new announcement.
 * - PLATFORM_ADMIN: Can create platform-wide announcements
 * - QCTO roles: Can create platform-wide announcements
 * - INSTITUTION_ADMIN: Can create institution-scoped announcements (automatically scoped to their institution)
 * - Can target specific user roles or all users (empty target_roles)
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    // Check if user can create announcements
    const QCTO_ROLES = [
      "QCTO_USER",
      "QCTO_SUPER_ADMIN",
      "QCTO_ADMIN",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];
    const canCreate = ctx.role === "PLATFORM_ADMIN" || QCTO_ROLES.includes(ctx.role) || ctx.role === "INSTITUTION_ADMIN";
    
    if (!canCreate) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins, QCTO users, and institution admins can create announcements", 403));
    }

    const body = await request.json();
    const { title, message, priority = "MEDIUM", expires_at, target_roles, institution_id } = body;

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

    // Validate target_roles if provided
    const validRoles = ANNOUNCEMENT_TARGET_ROLES.map((r) => r.value);
    
    let targetRolesArray: string[] = [];
    if (target_roles) {
      if (!Array.isArray(target_roles)) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "target_roles must be an array", 400));
      }
      targetRolesArray = target_roles.filter((r: string) => validRoles.includes(r));
      if (targetRolesArray.length !== target_roles.length) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid role(s) in target_roles", 400));
      }
      
      // Institution admins can only target STUDENT and INSTITUTION_STAFF
      if (ctx.role === "INSTITUTION_ADMIN") {
        const allowedRoles = ["STUDENT", "INSTITUTION_STAFF"];
        const invalidRoles = targetRolesArray.filter((r) => !allowedRoles.includes(r));
        if (invalidRoles.length > 0) {
          return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Institution admins can only target Students and Institution Staff, not: ${invalidRoles.join(", ")}`, 400));
        }
      }
    }
    // Empty array means visible to all users (or all institution users for institution admins)

    // Get creator info at creation time (denormalize for historical accuracy)
    // Check if user exists - if not, this is a data integrity issue
    const creator = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        institution_id: true, // Get user's institution for institution admins
      },
    });

    if (!creator) {
      // User doesn't exist - this shouldn't happen but handle gracefully
      console.error(`[POST /api/announcements] User not found: ${ctx.userId}, role: ${ctx.role}`);
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "User account not found. Please log out and log back in.", 404));
    }

    const creatorName = `${creator.first_name} ${creator.last_name}`;

    // Determine institution_id for the announcement
    let announcementInstitutionId: string | null = null;
    
    if (ctx.role === "INSTITUTION_ADMIN") {
      // Institution admins can only create announcements for their own institution
      if (!creator.institution_id) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Institution admin must be associated with an institution", 400));
      }
      announcementInstitutionId = creator.institution_id;
      
      // Institution admins cannot override institution_id
      if (institution_id && institution_id !== creator.institution_id) {
        return fail(new AppError(ERROR_CODES.FORBIDDEN, "Institution admins can only create announcements for their own institution", 403));
      }
    } else if (ctx.role === "PLATFORM_ADMIN" || QCTO_ROLES.includes(ctx.role)) {
      // Platform admins and QCTO users can create platform-wide (null) or institution-specific announcements
      announcementInstitutionId = institution_id || null;
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        priority: priority || "MEDIUM",
        created_by: ctx.userId,
        created_by_name: creatorName, // Store name at creation time
        created_by_role: creator.role, // Store role at creation time
        target_roles: targetRolesArray, // Store target roles (empty = all users)
        institution_id: announcementInstitutionId, // Institution-scoped or null for platform-wide
        expires_at: expiresAtDate,
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
          name: creatorName,
          role: formatRoleForDisplay(creator.role),
          email: creator.email,
        },
        target_roles: announcement.target_roles || [],
        institution_id: announcement.institution_id || null,
        expires_at: announcement.expires_at?.toISOString() || null,
        created_at: announcement.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}
