import { prisma } from "@/lib/prisma";

/**
 * Generates a unique reference code for a submission.
 * Format: SUB-YYYY-XXXX (e.g., SUB-2026-0001)
 * 
 * Uses a pragmatic approach: count existing submissions for the year + 1,
 * then check for collision (retry if needed).
 * Note: Not strictly atomic, but sufficient for low-volume submission generation.
 */
export async function generateSubmissionReference(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const prefix = `SUB-${year}-`;

    // Get count of submissions for this year to estimate next number
    // We use "startsWith" to filter by the string format efficiently
    const count = await prisma.submission.count({
        where: {
            reference_code: {
                startsWith: prefix,
            },
        },
    });

    let nextNum = count + 1;
    let candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;

    // Collision check loop (simple retry)
    // In high concurrency this might fail, but for this app volume it's fine.
    // A proper sequence table would be better if volume scales.
    let isUnique = false;
    while (!isUnique) {
        const existing = await prisma.submission.findUnique({
            where: { reference_code: candidate },
            select: { submission_id: true },
        });

        if (!existing) {
            isUnique = true;
        } else {
            nextNum++;
            candidate = `${prefix}${nextNum.toString().padStart(4, "0")}`;
        }
    }

    return candidate;
}
