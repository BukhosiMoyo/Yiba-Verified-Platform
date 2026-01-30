import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/institutions/documents/suggestions
 * 
 * Get suggested documents from the institution's vault that match
 * the section's document requirements.
 * 
 * Query params:
 * - institutionId: string (required)
 * - sectionName: string (optional)
 * - documentType: string (optional)
 * - readinessId: string (optional) - for similar readiness records
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Institution roles and PLATFORM_ADMIN can get suggestions
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", 403);
    }

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get("institutionId");
    const sectionName = searchParams.get("sectionName");
    const documentType = searchParams.get("documentType");
    const readinessId = searchParams.get("readinessId");

    if (!institutionId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "institutionId is required", 400);
    }

    // Institution scoping
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (ctx.institutionId !== institutionId) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Access denied", 403);
      }
    }

    // Build query to find relevant documents
    const where: any = {
      deleted_at: null,
      OR: [
        { related_entity: "INSTITUTION", related_entity_id: institutionId },
        { related_entity: "READINESS", related_entity_id: institutionId }, // Legacy support
      ],
    };

    // Filter by document type if provided
    if (documentType) {
      where.document_type = {
        contains: documentType,
        mode: "insensitive",
      };
    }

    // Fetch documents
    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploaded_at: "desc" },
      take: 20, // Limit to 20 most recent
      select: {
        document_id: true,
        file_name: true,
        document_type: true,
        mime_type: true,
        file_size_bytes: true,
        uploaded_at: true,
      },
    });

    // Score documents by relevance
    const scoredDocuments = documents.map((doc) => {
      let score = 0;
      
      // Higher score if document type matches
      if (documentType && doc.document_type) {
        const docTypeUpper = doc.document_type.toUpperCase();
        const searchTypeUpper = documentType.toUpperCase();
        if (docTypeUpper === searchTypeUpper) {
          score += 10;
        } else if (docTypeUpper.includes(searchTypeUpper) || searchTypeUpper.includes(docTypeUpper)) {
          score += 5;
        }
      }
      
      // Higher score for more recent documents
      const daysSinceUpload = (Date.now() - new Date(doc.uploaded_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpload < 30) score += 2;
      else if (daysSinceUpload < 90) score += 1;

      return {
        ...doc,
        relevanceScore: score,
      };
    });

    // Sort by relevance score
    scoredDocuments.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      suggestions: scoredDocuments,
    });
  } catch (error: any) {
    return fail(error);
  }
}
