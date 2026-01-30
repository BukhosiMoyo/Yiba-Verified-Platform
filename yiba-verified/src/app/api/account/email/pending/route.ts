import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskEmail } from "@/lib/email/emailChangeTemplates";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pendingRequest = await prisma.emailChangeRequest.findFirst({
      where: {
        user_id: session.user.userId,
        status: "PENDING",
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!pendingRequest) {
      return NextResponse.json({ pending: false });
    }

    return NextResponse.json({
      pending: true,
      requestId: pendingRequest.id,
      newEmail: maskEmail(pendingRequest.new_email),
      expiresAt: pendingRequest.expires_at.toISOString(),
      createdAt: pendingRequest.created_at.toISOString(),
    });
  } catch (error) {
    console.error("Get pending email change error:", error);
    return NextResponse.json(
      { error: "Failed to get pending request" },
      { status: 500 }
    );
  }
}
