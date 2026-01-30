import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    // Find the request and verify ownership
    const emailChangeRequest = await prisma.emailChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!emailChangeRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (emailChangeRequest.user_id !== session.user.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (emailChangeRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Cancel the request
    await prisma.emailChangeRequest.update({
      where: { id: requestId },
      data: {
        status: "CANCELLED",
        cancelled_at: new Date(),
      },
    });

    // Log activity
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "Unknown";
    const userAgent = request.headers.get("user-agent") || "Unknown";

    await prisma.userActivityLog.create({
      data: {
        user_id: session.user.userId,
        activity_type: "EMAIL_CHANGE_CANCELLED",
        ip_address: ipAddress,
        user_agent: userAgent,
        success: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email change request cancelled",
    });
  } catch (error) {
    console.error("Cancel email change error:", error);
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 }
    );
  }
}
