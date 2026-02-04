
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { CohortLearnersList } from "@/components/institution/attendance/CohortLearnersList";
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
        title: cohort ? `${cohort.name} | Learners` : "Cohort Learners",
    };
}

export default async function CohortLearnersPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return notFound();

    const { cohortId } = await params;

    // Verify access
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) return notFound();

    const cohort = await prisma.cohort.findUnique({
        where: { cohort_id: cohortId },
        select: { name: true, institution_id: true }
    });

    if (!cohort || cohort.institution_id !== currentInstitutionId) {
        return notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{cohort.name}: Learners</h1>
                <p className="text-muted-foreground">
                    Manage learners assigned to this cohort.
                </p>
            </div>

            <CohortLearnersList cohortId={cohortId} />
        </div>
    );
}
