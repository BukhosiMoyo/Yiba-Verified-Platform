import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StudentCVPreview } from "@/components/student/StudentCVPreview";
import type { PublicProfileEditable, PublicProfileSystem } from "@/lib/student-profile-mock";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Public profile page. No auth; link-only access via unguessable [id].
 * Uses public_profile_id (unguessable string) or falls back to learner_id (UUID) for backward compatibility.
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;

  // Try to find by public_profile_id first, then fall back to learner_id for backward compatibility
  // Only show if public_profile_enabled is true
  const learner = await prisma.learner.findFirst({
    where: {
      OR: [
        { public_profile_id: id, public_profile_enabled: true },
        { learner_id: id, public_profile_enabled: true }, // Backward compatibility: allow learner_id if public_profile_id not set, but only if enabled
      ],
      deleted_at: null,
      // Only show profiles for learners with linked user accounts (active students)
      user_id: { not: null },
      // Must have public profile enabled
      public_profile_enabled: true,
    },
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

  if (!learner) {
    notFound();
  }

  // Build system data from database records (same logic as private profile)
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

  // Build system data
  const systemData: PublicProfileSystem = {
    header: {
      name: learnerName,
      verifiedBy: institutionName,
      institutions: [
        {
          name: institutionName,
          studentId: studentId,
        },
      ],
    },
    qualifications,
    workplaceEvidence: {
      total: workplaceEvidence.length,
      recent: workplaceEvidence.slice(0, 5), // Show 5 most recent
    },
  };

  // Use public profile editable data if available, otherwise empty
  const editableData: PublicProfileEditable = {
    photoUrl: null, // TODO: Add public photo support
    bio: learner.public_bio || "",
    skills: learner.public_skills || [],
    projects: (learner.public_projects as Array<{ id: string; title: string; description: string; link?: string }>) || [],
  };

  // Determine target role from first qualification
  const targetRole = qualifications[0]?.title.split(":")[1]?.trim() || "General";

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Yiba Verified — Public profile
        </p>
        <StudentCVPreview
          editable={editableData}
          system={systemData}
          targetRole={targetRole}
          variant="full"
        />
      </div>
    </div>
  );
}
