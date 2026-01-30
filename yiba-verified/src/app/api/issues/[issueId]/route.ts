import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";

type RouteParams = { params: Promise<{ issueId: string }> };

/**
 * GET /api/issues/[issueId]
 * Get a single issue
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { ctx } = await requireAuth(req);
    const { issueId } = await params;

    const issue = await prisma.issueReport.findUnique({
      where: { id: issueId },
      include: {
        reporter: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
          },
        },
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
        assignee: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
          },
        },
        attachments: true,
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check authorization
    const isAdmin = ctx.role === "PLATFORM_ADMIN";
    const isReporter = issue.reportedBy === ctx.userId;

    if (!isAdmin && !isReporter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      issue: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        pageUrl: issue.pageUrl,
        internalNotes: isAdmin ? issue.internalNotes : null,
        resolution: issue.resolution,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolvedAt: issue.resolvedAt,
        reporter: {
          userId: issue.reporter.user_id,
          name: `${issue.reporter.first_name} ${issue.reporter.last_name}`,
          email: issue.reporter.email,
          role: issue.reporter.role,
        },
        institution: issue.institution
          ? {
              id: issue.institution.institution_id,
              name:
                issue.institution.trading_name ||
                issue.institution.legal_name,
            }
          : null,
        assignee: issue.assignee
          ? {
              userId: issue.assignee.user_id,
              name: `${issue.assignee.first_name} ${issue.assignee.last_name}`,
            }
          : null,
        attachments: issue.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching issue:", error);
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch issue" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/issues/[issueId]
 * Update an issue (admin only for most fields)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { ctx } = await requireAuth(req);
    const { issueId } = await params;
    const body = await req.json();

    const issue = await prisma.issueReport.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const isAdmin = ctx.role === "PLATFORM_ADMIN";
    const isReporter = issue.reportedBy === ctx.userId;

    if (!isAdmin && !isReporter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data based on role
    const updateData: any = {};

    // Admin-only fields
    if (isAdmin) {
      if (body.status !== undefined) {
        updateData.status = body.status;
        if (body.status === "RESOLVED" || body.status === "CLOSED") {
          updateData.resolvedAt = new Date();
        }
      }
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
      if (body.internalNotes !== undefined)
        updateData.internalNotes = body.internalNotes;
      if (body.resolution !== undefined) updateData.resolution = body.resolution;
    }

    // Reporter can update title/description only if status is OPEN
    if (isReporter && issue.status === "OPEN") {
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined)
        updateData.description = body.description;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid updates" }, { status: 400 });
    }

    const updated = await prisma.issueReport.update({
      where: { id: issueId },
      data: updateData,
    });

    return NextResponse.json({
      issue: {
        id: updated.id,
        status: updated.status,
        priority: updated.priority,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error updating issue:", error);
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    );
  }
}
