
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { SessionRegister } from "@/components/institution/attendance/SessionRegister";
import { Metadata } from "next";

type Props = {
    params: Promise<{ sessionId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { sessionId } = await params;
    const session = await prisma.classSession.findUnique({
        where: { session_id: sessionId },
        include: { cohort: { select: { name: true } } }
    });

    return {
        title: session ? `${session.cohort.name} Attendance` : "Mark Attendance",
    };
}

export default async function RegisterPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return notFound();

    const { sessionId } = await params;

    // Verify access (basic check)
    // Deeper checks happen in API
    const classSession = await prisma.classSession.findUnique({
        where: { session_id: sessionId },
        select: { cohortId: true } // Just ensuring it exists
    });

    if (!classSession) return notFound();

    return (
        <div className="space-y-6">
            <SessionRegister sessionId={sessionId} />
        </div>
    );
}
