
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { CohortSessionsList } from "@/components/institution/attendance/CohortSessionsList";
import { Metadata } from "next";

type Props = {
    params: Promise<{ cohortId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { cohortId } = await params;
    const cohort = await prisma.cohort.findUnique({
        where: { cohort_id: cohortId },
        select: { name: true },
    });

    return {
        title: cohort ? `${cohort.name} | Sessions` : "Cohort Sessions",
    };
}

export default async function CohortSessionsPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return notFound();

    const { cohortId } = await params;

    // Verify access
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) return notFound();

    const cohort = await prisma.cohort.findUnique({
        where: { cohort_id: cohortId },
        include: {
            qualification: true,
            _count: { select: { enrolments: true } },
        },
    });

    if (!cohort || cohort.institution_id !== currentInstitutionId) {
        return notFound();
    }

    // TODO: Add Facilitator access check (ensure they are assigned via facilitators relation)
    // For now, relying on CohortSessionsList API check, but page load should safest be checked too.
    // ... check logic ...

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{cohort.name}</h1>
                <p className="text-muted-foreground">
                    {cohort.qualification.name} ({cohort.qualification.code}) • {cohort._count.enrolments} Learners
                </p>
            </div>

            <CohortSessionsList cohortId={cohortId} />
        </div>
    );
}
