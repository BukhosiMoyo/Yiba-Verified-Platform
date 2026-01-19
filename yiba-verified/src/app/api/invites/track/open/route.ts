// GET /api/invites/track/open - Track email open (tracking pixel)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

/**
 * GET /api/invites/track/open
 * Tracks when an invite email is opened (via tracking pixel)
 * 
 * Query params:
 * - token: The raw invite token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawToken = searchParams.get("token");

    if (!rawToken) {
      // Return transparent 1x1 pixel even if token is missing
      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
        {
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    // Hash the token to find the invite
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    // Update invite to mark as opened
    await prisma.invite.updateMany({
      where: {
        token_hash: tokenHash,
        opened_at: null, // Only update if not already opened
      },
      data: {
        status: "OPENED",
        opened_at: new Date(),
      },
    });

    // Return transparent 1x1 pixel
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    // Still return pixel even on error (fail silently for tracking)
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}
