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
 * - rid: Recipient ID (invite_id) - Alternative to token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawToken = searchParams.get("token");
    const inviteId = searchParams.get("rid"); // Recipient ID

    let invite = null;

    if (rawToken) {
      // Hash the token to find the invite
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      invite = await prisma.invite.findUnique({
        where: { token_hash: tokenHash },
      });
    } else if (inviteId) {
      invite = await prisma.invite.findUnique({
        where: { invite_id: inviteId },
      });
    }

    if (invite) {
      // 1. Log Event
      // Check if we should log (avoid spamming if same user refreshes instantly? For now, log everything for timeline)
      await prisma.inviteEvent.create({
        data: {
          invite_id: invite.invite_id,
          campaign_id: invite.campaign_id,
          type: "OPENED",
          metadata: {
            ip: request.headers.get("x-forwarded-for") || "unknown",
            user_agent: request.headers.get("user-agent") || "unknown",
          },
        },
      });

      // 2. Update Invite Status if first open
      if (!invite.opened_at) {
        await prisma.invite.update({
          where: { invite_id: invite.invite_id },
          data: {
            status: invite.status === "ACCEPTED" ? "ACCEPTED" : "OPENED", // Don't downgrade status
            opened_at: new Date(),
          },
        });

        // 3. Update Campaign Stats (Unique opens)
        if (invite.campaign_id) {
          await prisma.inviteCampaign.update({
            where: { campaign_id: invite.campaign_id },
            data: {
              opened_count: { increment: 1 },
            },
          });
        }
      }
    }

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
    console.error("Open tracking error:", error);
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

