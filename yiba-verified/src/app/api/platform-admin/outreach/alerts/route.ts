
import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for alerts
    return NextResponse.json([
        {
            id: 'alert_1',
            type: 'DELIVERABILITY',
            message: 'Bounce rate exceeded 5% on "Initial Outreach" campaign',
            severity: 'HIGH',
            timestamp: new Date().toISOString()
        },
        {
            id: 'alert_2',
            type: 'AI_OVERSIGHT',
            message: '3 drafts flagged for manual review',
            severity: 'MEDIUM',
            timestamp: new Date().toISOString()
        }
    ]);
}
