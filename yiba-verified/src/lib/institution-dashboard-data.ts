/**
 * Server-side data fetching for institution dashboard.
 * Reuses logic from /api/institution/activity and /api/institution/dashboard.
 * Used by the institution dashboard RSC; API routes remain for other clients.
 */
import { prisma } from "@/lib/prisma";

const ACTIVITY_LIMIT = 10;

export type ActivityItem = {
  id: string;
  type: "learner" | "document" | "readiness" | "enrolment";
  title: string;
  description: string;
  timestamp: string;
};

export type DashboardMetrics = {
  activeLearners: number;
  newLearnersThisMonth: number;
  readinessSubmitted: number;
  readinessTotal: number;
  documentCount: number;
  flaggedCount: number;
};

export type RecentLearnerItem = {
  learner_id: string;
  name: string;
  national_id: string | null;
  qualification: string;
  status: string;
  enrolled_at: string;
};

export async function fetchInstitutionActivity(
  institutionId: string
): Promise<{ items: ActivityItem[] }> {
  const [recentLearners, recentDocuments, recentReadiness, recentEnrolments] =
    await Promise.all([
      prisma.learner.findMany({
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
        take: ACTIVITY_LIMIT,
        select: {
          learner_id: true,
          first_name: true,
          last_name: true,
          created_at: true,
        },
      }),
      prisma.document.findMany({
        where: {
          uploadedByUser: { institution_id: institutionId },
        },
        orderBy: { uploaded_at: "desc" },
        take: ACTIVITY_LIMIT,
        select: {
          document_id: true,
          file_name: true,
          document_type: true,
          uploaded_at: true,
        },
      }),
      prisma.readiness.findMany({
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
        orderBy: { updated_at: "desc" },
        take: ACTIVITY_LIMIT,
        select: {
          readiness_id: true,
          qualification_title: true,
          readiness_status: true,
          submission_date: true,
          updated_at: true,
        },
      }),
      prisma.enrolment.findMany({
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
        take: ACTIVITY_LIMIT,
        select: {
          enrolment_id: true,
          created_at: true,
          learner: {
            select: { first_name: true, last_name: true },
          },
          qualification: { select: { name: true } },
          qualification_title: true,
        },
      }),
    ]);

  const activities: ActivityItem[] = [];

  for (const l of recentLearners) {
    activities.push({
      id: `learner-${l.learner_id}`,
      type: "learner",
      title: "Learner created",
      description: `${l.first_name} ${l.last_name}`,
      timestamp: l.created_at.toISOString(),
    });
  }
  for (const d of recentDocuments) {
    activities.push({
      id: `doc-${d.document_id}`,
      type: "document",
      title: "Evidence uploaded",
      description: d.file_name || d.document_type || "Document",
      timestamp: d.uploaded_at.toISOString(),
    });
  }
  for (const r of recentReadiness) {
    const isSubmitted = ["SUBMITTED", "UNDER_REVIEW", "REVIEWED"].includes(
      r.readiness_status
    );
    activities.push({
      id: `readiness-${r.readiness_id}`,
      type: "readiness",
      title: isSubmitted ? "Readiness submitted" : "Readiness updated",
      description: r.qualification_title || "Qualification readiness",
      timestamp: (r.submission_date ?? r.updated_at).toISOString(),
    });
  }
  for (const e of recentEnrolments) {
    activities.push({
      id: `enrolment-${e.enrolment_id}`,
      type: "enrolment",
      title: "Learner enrolled",
      description: `${e.learner.first_name} ${e.learner.last_name} - ${e.qualification?.name ?? e.qualification_title ?? "Qualification"}`,
      timestamp: e.created_at.toISOString(),
    });
  }

  activities.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const items = activities.slice(0, ACTIVITY_LIMIT);

  return { items };
}

export async function fetchInstitutionDashboard(
  institutionId: string
): Promise<{
  metrics: DashboardMetrics;
  recentLearners: RecentLearnerItem[];
}> {
  const [
    activeLearnerCount,
    totalLearnerCount,
    thisMonthLearnerCount,
    readinessStats,
    documentCount,
    flaggedCount,
    recentLearners,
  ] = await Promise.all([
    prisma.learner.count({
      where: {
        institution_id: institutionId,
        deleted_at: null,
        enrolments: {
          some: {
            enrolment_status: "ACTIVE",
            deleted_at: null,
          },
        },
      },
    }),
    prisma.learner.count({
      where: {
        institution_id: institutionId,
        deleted_at: null,
      },
    }),
    prisma.learner.count({
      where: {
        institution_id: institutionId,
        deleted_at: null,
        created_at: {
          gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ),
        },
      },
    }),
    prisma.readiness.groupBy({
      by: ["readiness_status"],
      where: {
        institution_id: institutionId,
        deleted_at: null,
      },
      _count: true,
    }),
    prisma.document.count({
      where: {
        uploadedByUser: { institution_id: institutionId },
      },
    }),
    prisma.evidenceFlag.count({
      where: {
        status: "ACTIVE",
        document: {
          uploadedByUser: { institution_id: institutionId },
        },
      },
    }),
    prisma.learner.findMany({
      where: {
        institution_id: institutionId,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        learner_id: true,
        first_name: true,
        last_name: true,
        national_id: true,
        created_at: true,
        enrolments: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            enrolment_id: true,
            enrolment_status: true,
            created_at: true,
            qualification: { select: { name: true } },
            qualification_title: true,
          },
        },
      },
    }),
  ]);

  const submittedStatuses = ["SUBMITTED", "UNDER_REVIEW", "REVIEWED", "RECOMMENDED"];
  const submittedCount = readinessStats
    .filter((s) => submittedStatuses.includes(s.readiness_status))
    .reduce((acc, s) => acc + s._count, 0);
  const totalReadiness = readinessStats.reduce((acc, s) => acc + s._count, 0);

  const metrics: DashboardMetrics = {
    activeLearners: activeLearnerCount || totalLearnerCount,
    newLearnersThisMonth: thisMonthLearnerCount,
    readinessSubmitted: submittedCount,
    readinessTotal: totalReadiness,
    documentCount,
    flaggedCount,
  };

  const recentLearnerItems: RecentLearnerItem[] = recentLearners.map((l) => ({
    learner_id: l.learner_id,
    name: `${l.first_name} ${l.last_name}`,
    national_id: l.national_id,
    qualification:
      l.enrolments[0]?.qualification?.name ??
      l.enrolments[0]?.qualification_title ??
      "—",
    status: l.enrolments[0]?.enrolment_status ?? "NOT_ENROLLED",
    enrolled_at:
      l.enrolments[0]?.created_at?.toISOString() ?? l.created_at.toISOString(),
  }));

  return { metrics, recentLearners: recentLearnerItems };
}
