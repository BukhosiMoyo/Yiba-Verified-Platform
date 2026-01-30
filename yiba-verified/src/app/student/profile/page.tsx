import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileViewClient } from "@/components/student/profile/ProfileViewClient";
import { EmptyState } from "@/components/shared/EmptyState";
import { User } from "lucide-react";
import type { MockStudentEditable, MockStudentSystem } from "@/components/student/StudentProfileClient";
import type { CVVersionRow } from "@/components/student/StudentCVVersionsTable";

/**
 * Student Profile (private view).
 * Layout enforces STUDENT role and session.
 * Fetches real user-specific data from database.
 */
export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.userId;

  // Fetch learner record with all related data
  const learner = await prisma.learner.findFirst({
    where: { user_id: userId, deleted_at: null },
    include: {
      institution: {
        select: {
          trading_name: true,
          legal_name: true,
        },
      },
      enrolments: {
        where: { deleted_at: null },
        include: {
          qualification: {
            select: {
              name: true,
              code: true,
            },
          },
          institution: {
            select: {
              trading_name: true,
              legal_name: true,
            },
          },
        },
        orderBy: { start_date: "desc" },
      },
      pastQualifications: {
        orderBy: { year_completed: "desc" },
        include: {
          document: {
            select: {
              document_id: true,
              file_name: true,
            },
          },
        },
      },
      priorLearning: {
        orderBy: { start_date: "desc" },
      },
      documents: {
        where: {
          related_entity: "LEARNER",
        },
        select: {
          document_id: true,
        },
      },
    },
  });

  // If no learner record, show empty state
  if (!learner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">Your verified CV and profile information</p>
        </div>
        <EmptyState
          title="No learner profile"
          description="Your account is not linked to a learner record. Contact your institution to set up your profile."
          icon={<User className="h-6 w-6" strokeWidth={1.5} />}
        />
      </div>
    );
  }

  // Build system data from database records
  const institutionName = learner.institution?.trading_name || learner.institution?.legal_name || "Unknown Institution";
  const studentId = learner.national_id || learner.alternate_id || "—";
  const learnerName = `${learner.first_name} ${learner.last_name}`;

  // Format verified date (use learner created_at as proxy)
  const verifiedDate = new Date(learner.created_at).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Build qualifications from enrolments
  const qualifications = learner.enrolments
    .filter((e) => e.qualification || e.qualification_title)
    .map((e) => ({
      title: e.qualification?.name || e.qualification_title || "Unknown Qualification",
      nqf: e.qualification?.code ? `NQF ${e.qualification.code}` : "NQF —",
      status: e.enrolment_status === "COMPLETED" ? "Verified" : "In Progress",
    }));

  // Add past qualifications
  const pastQuals = learner.pastQualifications.map((pq) => ({
    title: pq.title,
    nqf: pq.year_completed ? `Completed ${pq.year_completed}` : "—",
    status: "Verified",
  }));
  qualifications.push(...pastQuals);

  // Build workplace evidence from prior learning
  const workplaceEvidence = learner.priorLearning.map((pl) => {
    const startDate = pl.start_date ? new Date(pl.start_date) : null;
    const endDate = pl.end_date ? new Date(pl.end_date) : null;
    const isCurrent = pl.is_current || (endDate && endDate > new Date());

    const formatDate = (d: Date) => {
      return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
    };

    const range = startDate && endDate
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : startDate
      ? `${formatDate(startDate)} – ${isCurrent ? "Present" : "—"}`
      : "—";

    return {
      workplace: pl.institution || "Unknown",
      role: pl.title,
      range,
    };
  });

  // Count evidence items (documents)
  const evidenceItemsCount = learner.documents.length;

  // Build system data
  const systemData: MockStudentSystem = {
    header: {
      name: learnerName,
      verifiedStatus: "Verified",
      verifiedDate,
      verifiedBy: institutionName,
      institutions: [
        {
          name: institutionName,
          studentId: studentId,
        },
      ],
      downloadCvOptions: [
        { id: "primary", label: "Primary CV" },
      ],
      shareOptions: [
        { id: "public", label: "Public link" },
        { id: "private", label: "Private link" },
      ],
    },
    qualifications,
    evidenceCounts: {
      qualifications: qualifications.length,
      evidenceItems: evidenceItemsCount,
      readinessSubmissions: 0, // TODO: Count readiness submissions if needed
    },
    workplaceEvidence: {
      total: workplaceEvidence.length,
      recent: workplaceEvidence.slice(0, 5), // Show 5 most recent
    },
  };

  // Use public profile data if available, otherwise empty
  // Note: Private bio/skills/projects are stored in localStorage in the client component
  const editableData: MockStudentEditable = {
    photoUrl: null, // TODO: Add photo support
    bio: learner.public_bio || "",
    skills: learner.public_skills || [],
    projects: (learner.public_projects as Array<{ id: string; title: string; description: string; link?: string }>) || [],
  };

  // Default CV versions (create one from learner data)
  const cvVersions: CVVersionRow[] = [
    {
      id: "primary",
      name: "Primary CV",
      targetRole: qualifications[0]?.title.split(":")[1]?.trim() || "General",
      visibility: "public",
      lastUpdated: verifiedDate,
    },
  ];

  // Use public_profile_id if available, otherwise use learner_id
  const profileId = learner.public_profile_id || learner.learner_id;

  return (
    <ProfileViewClient
      initialEditable={editableData}
      system={systemData}
      cvVersions={cvVersions}
      learnerId={learner.learner_id}
      publicProfileId={learner.public_profile_id}
      publicProfileEnabled={learner.public_profile_enabled}
    />
  );
}
