"use client";

import { useEffect, useState, use } from "react";
import { ProfileSummary } from "../../_components/ProfileSummary";
import { JourneyTimeline } from "../../_components/JourneyTimeline";
import { ActionRail } from "../../_components/ActionRail";
import { AnswersViewer } from "../../_components/AnswersViewer";
import { awarenessApi } from "@/lib/outreach/api";
import {
    InstitutionOutreachProfile,
    OutreachEvent,
    QuestionnaireResponse,
} from "@/lib/outreach/types";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ManualEmailComposer } from "../../_components/ManualEmailComposer"; // Swap out the static button

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function InstitutionDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [institution, setInstitution] = useState<InstitutionOutreachProfile | null>(
        null
    );
    const [timeline, setTimeline] = useState<OutreachEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // MOCK responses for now - in real app, fetch via API
    const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [instData, timelineData] = await Promise.all([
                    awarenessApi.getInstitution(id),
                    awarenessApi.getTimeline(id),
                ]);
                setInstitution(instData);
                setTimeline(timelineData);

                // Mock loading responses
                try {
                    const respData = await awarenessApi.getQuestionnaireResponses("mock_quest_id");
                    // Filter only if mock returns generic list, but our API mock assumes specific ID
                    // For now just set whatever comes back to demonstrate UI
                    setResponses(respData);
                } catch (e) {
                    console.log("No responses found or mock error");
                }

            } catch (error) {
                console.error("Failed to load institution details:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!institution) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <div className="text-lg text-muted-foreground">Institution not found</div>
                <Button asChild variant="outline">
                    <Link href="/platform-admin/outreach/pipeline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Pipeline
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/platform-admin/outreach/pipeline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">Institution Details</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-12 h-[calc(100vh-200px)]">
                {/* Left Sidebar: Profile & Answers */}
                <div className="md:col-span-3 space-y-6 overflow-y-auto pr-2">
                    <ProfileSummary institution={institution} />
                    <AnswersViewer responses={responses} />
                </div>

                {/* Center: Timeline */}
                <div className="md:col-span-6 h-full">
                    <JourneyTimeline events={timeline} />
                </div>

                {/* Right Sidebar: Actions */}
                <div className="md:col-span-3 h-full">
                    {/* We pass components into ActionRail or we manually place ManualEmailComposer there? 
                ActionRail currently has hardcoded buttons. Let's start by just rendering ActionRail 
                and maybe keeping ManualEmailComposer separate for now or refactoring ActionRail.
                Actually, simpler: Just render ActionRail. We can enhance it later.
             */}
                    <div className="space-y-4">
                        <ActionRail institution={institution} />
                        {/* Floating Composer Trigger could go here if not inside ActionRail */}
                    </div>
                </div>
            </div>
        </div>
    );
}
