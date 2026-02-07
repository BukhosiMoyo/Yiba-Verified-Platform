
import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for dashboard metrics
    return NextResponse.json({
        sent: 1250,
        delivered: 1200,
        opened: 850,
        clicked: 420,
        responses: 156,
        signups: 45,
        declines: 12,
        conversion_rate: 3.6,
        avg_time_to_signup_hours: 48
    });
}
