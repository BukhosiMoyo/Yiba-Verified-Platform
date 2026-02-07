
import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data for pipeline
    // Returns institutions grouped by stage or just a flat list that the frontend groups
    // Based on PipelinePageClient.tsx, it likely expects a list of institutions

    return NextResponse.json([
        {
            institution_id: 'inst_1',
            institution_name: 'Tech University',
            province: 'Gauteng',
            engagement_stage: 'UNCONTACTED',
            engagement_score: 10,
            last_activity: new Date().toISOString(),
            status_flags: {}
        },
        {
            institution_id: 'inst_2',
            institution_name: 'Coastal College',
            province: 'KZN',
            engagement_stage: 'CONTACTED',
            engagement_score: 35,
            last_activity: new Date().toISOString(),
            status_flags: { opened: true }
        },
        {
            institution_id: 'inst_3',
            institution_name: 'Metro Skills',
            province: 'Western Cape',
            engagement_stage: 'ENGAGED',
            engagement_score: 65,
            last_activity: new Date().toISOString(),
            status_flags: { clicked: true }
        },
        {
            institution_id: 'inst_4',
            institution_name: 'Rural Academy',
            province: 'Limpopo',
            engagement_stage: 'EVALUATING',
            engagement_score: 80,
            last_activity: new Date().toISOString(),
            status_flags: { replied: true }
        }
    ]);
}
