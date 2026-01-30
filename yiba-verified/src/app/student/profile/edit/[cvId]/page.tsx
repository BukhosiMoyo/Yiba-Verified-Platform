import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditCVLayout } from "@/components/student/profile/EditCVLayout";
import type { MockStudentEditable, MockStudentSystem } from "@/components/student/StudentProfileClient";
import type { CVVersionRow } from "@/components/student/StudentCVVersionsTable";

type PageProps = { params: Promise<{ cvId: string }> };

/**
 * Edit CV page. Full-screen workspace, no AppShell.
 * Layout wrapper renders without sidebar/topbar for this route.
 */
export default async function EditCVPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { cvId } = await params;

  const learner = await prisma.learner.findFirst({
    where: { user_id: session.user.userId, deleted_at: null },
    include: {
      institution: { select: { trading_name: true, legal_name: true } },
      enrolments: {
        where: { deleted_at: null },
        include: { qualification: { select: { name: true, code: true } } },
        orderBy: { start_date: "desc" },
      },
      pastQualifications: {
        orderBy: { year_completed: "desc" },
        include: { document: { select: { document_id: true, file_name: true } } },
      },
      priorLearning: { orderBy: { start_date: "desc" } },
      documents: { where: { related_entity: "LEARNER" }, select: { document_id: true } },
    },
  });

  if (!learner) redirect("/student/profile");

  const institutionName = learner.institution?.trading_name || learner.institution?.legal_name || "Unknown Institution";
  const studentId = learner.national_id || learner.alternate_id || "—";
  const learnerName = `${learner.first_name} ${learner.last_name}`;
  const verifiedDate = new Date(learner.created_at).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const qualifications = learner.enrolments
    .filter((e) => e.qualification || e.qualification_title)
    .map((e) => ({
      title: e.qualification?.name || e.qualification_title || "Unknown Qualification",
      nqf: e.qualification?.code ? `NQF ${e.qualification.code}` : "NQF —",
      status: e.enrolment_status === "COMPLETED" ? "Verified" : "In Progress",
    }));
  const pastQuals = learner.pastQualifications.map((pq) => ({
    title: pq.title,
    nqf: pq.year_completed ? `Completed ${pq.year_completed}` : "—",
    status: "Verified",
  }));
  qualifications.push(...pastQuals);

  const workplaceEvidence = learner.priorLearning.map((pl) => {
    const startDate = pl.start_date ? new Date(pl.start_date) : null;
    const endDate = pl.end_date ? new Date(pl.end_date) : null;
    const isCurrent = pl.is_current || (endDate && endDate > new Date());
    const formatDate = (d: Date) => d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
    const range =
      startDate && endDate
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

  const system: MockStudentSystem = {
    header: {
      name: learnerName,
      verifiedStatus: "Verified",
      verifiedDate,
      verifiedBy: institutionName,
      institutions: [{ name: institutionName, studentId }],
      downloadCvOptions: [{ id: "primary", label: "Primary CV" }],
      shareOptions: [{ id: "public", label: "Public link" }, { id: "private", label: "Private link" }],
    },
    qualifications,
    evidenceCounts: {
      qualifications: qualifications.length,
      evidenceItems: learner.documents.length,
      readinessSubmissions: 0,
    },
    workplaceEvidence: { total: workplaceEvidence.length, recent: workplaceEvidence.slice(0, 5) },
  };

  const editable: MockStudentEditable = {
    photoUrl: null,
    bio: learner.public_bio || "",
    skills: learner.public_skills || [],
    projects: (learner.public_projects as Array<{ id: string; title: string; description: string; link?: string }>) || [],
  };

  const cvVersions: CVVersionRow[] = [
    {
      id: "primary",
      name: "Primary CV",
      targetRole: qualifications[0]?.title.split(":")[1]?.trim() || "General",
      visibility: "public",
      lastUpdated: verifiedDate,
    },
  ];

  const cv = cvVersions.find((c) => c.id === cvId);
  if (!cv) notFound();

  return (
    <EditCVLayout
      cvId={cvId}
      cvName={cv.name}
      initialEditable={editable}
      system={system}
      targetRole={cv.targetRole}
      publicProfileId={learner.public_profile_id}
      learnerId={learner.learner_id}
      publicProfileEnabled={learner.public_profile_enabled}
    />
  );
}
