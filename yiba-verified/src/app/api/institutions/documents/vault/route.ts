import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/institutions/documents/vault
 * 
 * Returns list of documents from institution's document vault.
 * Used for selecting existing documents to link to readiness records.
 * 
 * Query params:
 *   ?institutionId=string - Institution ID (required for institution users)
 *   ?q=string - Search query
 *   ?limit=number - Default 50, max 200
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Institution roles and PLATFORM_ADMIN can access
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to access document vault", 403);
    }

    const { searchParams } = new URL(request.url);
    const institutionIdParam = searchParams.get("institutionId");
    const searchQuery = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    // Determine institution ID
    let institutionId: string;
    if (ctx.role === "PLATFORM_ADMIN") {
      if (!institutionIdParam) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "institutionId query parameter is required", 400);
      }
      institutionId = institutionIdParam;
    } else {
      // Institution users can only access their own institution's vault
      if (!ctx.institutionId) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403);
      }
      institutionId = ctx.institutionId;
      // Validate that requested institution matches user's institution (if provided)
      if (institutionIdParam && institutionIdParam !== ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Access denied: Cannot access another institution's document vault",
          403
        );
      }
    }

    // Build where clause
    const where: any = {
      related_entity: "INSTITUTION",
      related_entity_id: institutionId,
      deleted_at: null,
    };

    // Add search filter
    if (searchQuery.length >= 2) {
      where.file_name = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    // Fetch documents
    const documents = await prisma.document.findMany({
      where,
      select: {
        document_id: true,
        file_name: true,
        document_type: true,
        mime_type: true,
        file_size_bytes: true,
        uploaded_at: true,
      },
      orderBy: { uploaded_at: "desc" },
      take: limit,
    });

    return NextResponse.json({
      count: documents.length,
      items: documents,
    });
  } catch (error: any) {
    return fail(error);
  }
}
