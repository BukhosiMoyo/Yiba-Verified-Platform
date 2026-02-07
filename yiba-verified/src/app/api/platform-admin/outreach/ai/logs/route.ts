
import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for AI generation logs
    return NextResponse.json(Array.from({ length: 15 }, (_, i) => ({
        id: `log_${i}`,
        action: 'GENERATE_DRAFT',
        institution: `Institution ${i + 1}`,
        status: i % 10 === 0 ? 'FLAGGED' : 'SUCCESS',
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        details: 'Generated initial outreach email for "Problem Aware" stage'
    })));
}
