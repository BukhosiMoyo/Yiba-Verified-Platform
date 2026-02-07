
import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for trend chart
    const trends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
            date: date.toISOString().split('T')[0],
            opens: Math.floor(Math.random() * 50) + 10,
            clicks: Math.floor(Math.random() * 20) + 5,
            signups: Math.floor(Math.random() * 5)
        };
    });

    return NextResponse.json(trends);
}
