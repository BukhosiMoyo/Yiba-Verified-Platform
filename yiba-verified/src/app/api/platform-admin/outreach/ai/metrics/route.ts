
import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for AI oversight metrics
    return NextResponse.json({
        total_generated: 1543,
        flagged_count: 23,
        approved_count: 1450,
        rejected_count: 70,
        avg_confidence: 0.92
    });
}
