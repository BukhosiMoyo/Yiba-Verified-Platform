
import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for flagged content
    return NextResponse.json([
        {
            id: 'flag_1',
            institution_name: 'Tech University',
            draft_subject: 'Invitation to Join',
            flag_reason: 'Contains prohibited phrase "guaranteed placement"',
            confidence: 0.9,
            created_at: new Date().toISOString()
        },
        {
            id: 'flag_2',
            institution_name: 'Coastal College',
            draft_subject: 'Urgent: Registration',
            flag_reason: 'Tone is too aggressive',
            confidence: 0.75,
            created_at: new Date().toISOString()
        }
    ]);
}
