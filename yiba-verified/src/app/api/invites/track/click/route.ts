// GET /api/invites/track/click - Track invite link click

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

/**
 * GET /api/invites/track/click
 * Tracks when an invite link is clicked and redirects to the invite page
 * 
 * Query params:
 * - token: The raw invite token
 * - redirect: The final redirect URL (the invite page)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawToken = searchParams.get("token");
    const redirectUrl = searchParams.get("redirect");

    if (!rawToken) {
      // Redirect to login if no token
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    // Hash the token to find the invite
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    // Update invite to mark as clicked
    await prisma.invite.updateMany({
      where: {
        token_hash: tokenHash,
        clicked_at: null, // Only update if not already clicked
      },
      data: {
        clicked_at: new Date(),
        // Update status if not already accepted
        status: {
          in: ["SENT", "OPENED", "DELIVERED"],
        },
      },
    });

    // Redirect to the invite page (or the provided redirect URL)
    const finalUrl = redirectUrl || `/invite?token=${encodeURIComponent(rawToken)}`;
    return NextResponse.redirect(new URL(finalUrl, request.url));
  } catch (error) {
    // Redirect to login on error
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }
}
