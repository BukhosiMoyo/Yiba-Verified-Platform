import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QualificationDetailsView } from "@/components/platform-admin/qualifications/QualificationDetailsView";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function QualificationDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    const qualification = await prisma.qualification.findUnique({
        where: { qualification_id: id },
        select: {
            qualification_id: true,
            name: true,
            code: true,
            type: true,
            status: true,
            nqf_level: true,
            credits: true,
            study_mode: true,
            duration_value: true,
            duration_unit: true,
            summary: true,
            assessment_type: true,
            modules: true,
            career_outcomes: true,
            entry_requirements: true,
            workplace_required: true,
            workplace_hours: true,
            saqa_id: true,
            curriculum_code: true,
            created_at: true,
            updated_at: true,
            _count: {
                select: { enrolments: true },
            },
        },
    });

    if (!qualification) {
        notFound();
    }

    return (
        <QualificationDetailsView qualification={qualification} />
    );
}
