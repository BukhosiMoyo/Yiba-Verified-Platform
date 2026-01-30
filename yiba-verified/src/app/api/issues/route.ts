import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api/context";

/**
 * GET /api/issues
 * List issues (for admin: all issues, for users: their own)
 */
export async function GET(req: NextRequest) {
  try {
    const { ctx } = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const isAdmin = ctx.role === "PLATFORM_ADMIN";

    // Build where clause
    const where: any = {};

    // Non-admins can only see their own issues
    if (!isAdmin) {
      where.reportedBy = ctx.userId;
    }

    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (priority) {
      where.priority = priority;
    }

    const [issues, total] = await Promise.all([
      prisma.issueReport.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.issueReport.count({ where }),
    ]);

    return NextResponse.json({
      issues: issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        pageUrl: issue.pageUrl,
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
        attachmentCount: issue.attachments.length,
        attachments: issue.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.fileType,
          fileSize: a.fileSize,
          storageKey: a.storageKey,
        })),
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching issues:", error);
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues
 * Create a new issue report
 */
export async function POST(req: NextRequest) {
  try {
    const { ctx } = await requireAuth(req);
    const body = await req.json();

    const { title, description, category, pageUrl, priority } = body;

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      "BUG",
      "DATA_ISSUE",
      "ACCESS_ISSUE",
      "FEATURE_REQUEST",
      "OTHER",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Create the issue
    const issue = await prisma.issueReport.create({
      data: {
        reportedBy: ctx.userId,
        institutionId: ctx.institutionId,
        title,
        description,
        category,
        pageUrl,
        priority: priority || "MEDIUM",
        status: "OPEN",
      },
      include: {
        reporter: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      issue: {
        id: issue.id,
        title: issue.title,
        category: issue.category,
        status: issue.status,
        createdAt: issue.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating issue:", error);
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
