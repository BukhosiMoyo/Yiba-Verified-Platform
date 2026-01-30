import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_PATH_LENGTH = 500;
const MAX_DIGEST_LENGTH = 100;

/**
 * POST /api/errors/report
 * Report a client-side / application error from the error boundary.
 * Callable without auth; optionally attaches user_id if session exists.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawMessage = typeof body.message === "string" ? body.message : "";
    const message = rawMessage.slice(0, MAX_MESSAGE_LENGTH) || "Unknown error";
    const digest =
      typeof body.digest === "string"
        ? body.digest.slice(0, MAX_DIGEST_LENGTH)
        : null;
    const path =
      typeof body.path === "string" ? body.path.slice(0, MAX_PATH_LENGTH) : null;

    let userId: string | null = null;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.userId) {
        userId = session.user.userId;
      }
    } catch {
      // Ignore session errors; report without user
    }

    await prisma.clientErrorReport.create({
      data: {
        message,
        digest,
        path,
        user_id: userId,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("Error report failed:", e);
    return NextResponse.json(
      { error: "Failed to report error" },
      { status: 500 }
    );
  }
}
