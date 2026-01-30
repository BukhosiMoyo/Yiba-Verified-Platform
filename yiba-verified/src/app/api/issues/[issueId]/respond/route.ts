import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api/context";
import { Notifications } from "@/lib/notifications";

/**
 * POST /api/issues/[issueId]/respond
 * Send a response/notification to the issue reporter
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const ctx = await requireRole(req, "PLATFORM_ADMIN");
    const { issueId } = await params;
    const body = await req.json();

    const { message, responseType } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get the issue and reporter
    const issue = await prisma.issueReport.findUnique({
      where: { id: issueId },
      include: {
        reporter: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Get admin user info
    const admin = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: {
        first_name: true,
        last_name: true,
      },
    });

    const adminName = admin
      ? `${admin.first_name} ${admin.last_name}`
      : "Platform Admin";

    // Create in-app notification for reporter (and send email via createNotification)
    await Notifications.issueResponse(
      issue.reportedBy,
      issue.id,
      `Response to your bug report: ${issue.title}`,
      message.trim()
    );

    // Also update issue with internal notes for admin tracking
    const existingNotes = issue.internalNotes || "";
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${adminName} sent ${responseType || "response"} to reporter`;

    await prisma.issueReport.update({
      where: { id: issueId },
      data: {
        internalNotes: existingNotes
          ? `${existingNotes}\n\n${newNote}`
          : newNote,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Response sent successfully",
    });
  } catch (error: any) {
    console.error("Error sending issue response:", error);
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to send response" },
      { status: 500 }
    );
  }
}
