import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { QuestionnaireRenderer } from "./_components/QuestionnaireRenderer";
import { Questionnaire } from "@/lib/outreach/types";

const prisma = new PrismaClient();

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function QuestionnairePage({ params }: PageProps) {
    const { slug } = await params;

    const questionnaire = await prisma.questionnaire.findUnique({
        where: { slug },
    });

    if (!questionnaire) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto pt-8 md:pt-12">
                <div className="flex justify-center mb-8">
                    {/* Brand Logo Placeholder */}
                    <div className="font-bold text-2xl tracking-tight text-primary">Yiba Verified</div>
                </div>
                <QuestionnaireRenderer questionnaire={questionnaire as unknown as Questionnaire} />
            </div>
        </div>
    );
}
