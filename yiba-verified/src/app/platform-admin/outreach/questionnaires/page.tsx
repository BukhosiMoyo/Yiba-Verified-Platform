"use client";

import { useEffect, useState } from "react";
import { QuestionnaireList } from "../_components/QuestionnaireList";
import { QuestionnaireWizard } from "../_components/QuestionnaireWizard";
import { awarenessApi } from "@/lib/outreach/api";
import { Questionnaire, TemplateStatus } from "@/lib/outreach/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function QuestionnairesPage() {
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuestionnaire, setCurrentQuestionnaire] = useState<Questionnaire | null>(null);

    useEffect(() => {
        loadQuestionnaires();
    }, []);

    const loadQuestionnaires = async () => {
        setLoading(true);
        try {
            const data = await awarenessApi.getQuestionnaires();
            setQuestionnaires(data);
        } catch (error) {
            console.error("Failed to load questionnaires:", error);
            toast.error("Failed to load questionnaires");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (q: Questionnaire) => {
        setCurrentQuestionnaire(q);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentQuestionnaire({
            questionnaire_id: "", // Empty ID indicates new
            slug: "",
            title: "",
            description: "",
            steps: [],
            status: TemplateStatus.DRAFT,
            created_at: new Date(),
            published_at: null,
        });
        setIsEditing(true);
    };

    const handleSave = async (q: Questionnaire) => {
        try {
            await awarenessApi.saveQuestionnaire(q);
            toast.success("Questionnaire saved successfully");
            setIsEditing(false);
            setCurrentQuestionnaire(null);
            loadQuestionnaires();
        } catch (error) {
            console.error("Failed to save questionnaire:", error);
            toast.error("Failed to save questionnaire");
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentQuestionnaire(null);
    };

    if (loading && !isEditing) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isEditing && currentQuestionnaire) {
        return (
            <div className="h-[calc(100vh-140px)] border rounded-lg overflow-hidden bg-background">
                <QuestionnaireWizard
                    initialData={currentQuestionnaire}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Questionnaires</h2>
            </div>

            <QuestionnaireList
                questionnaires={questionnaires}
                onEdit={handleEdit}
                onCreate={handleCreate}
            />
        </div>
    );
}
