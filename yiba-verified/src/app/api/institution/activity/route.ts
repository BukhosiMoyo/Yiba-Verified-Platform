import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/institution/activity
 * 
 * Returns recent activity for the current user's institution.
 * Fetches from audit logs, documents, learners, and readiness records.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const institutionId = ctx.institutionId;

    if (!institutionId) {
      return NextResponse.json(
        { error: "User is not associated with an institution", code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      );
    }

    const limit = 10;

    // Fetch recent activities in parallel
    const [recentLearners, recentDocuments, recentReadiness, recentEnrolments] = await Promise.all([
      // Recent learners created/updated
      prisma.learner.findMany({
        where: { 
          institution_id: institutionId,
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
        take: limit,
        select: {
          learner_id: true,
          first_name: true,
          last_name: true,
          created_at: true,
          updated_at: true,
        },
      }),
      // Recent documents uploaded
      prisma.document.findMany({
        where: {
          uploadedByUser: {
            institution_id: institutionId,
          },
        },
        orderBy: { uploaded_at: "desc" },
        take: limit,
        select: {
          document_id: true,
          file_name: true,
          document_type: true,
          uploaded_at: true,
        },
      }),
      // Recent readiness records
      prisma.readiness.findMany({
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
        orderBy: { updated_at: "desc" },
        take: limit,
        select: {
          readiness_id: true,
          qualification_title: true,
          readiness_status: true,
          created_at: true,
          updated_at: true,
          submission_date: true,
        },
      }),
      // Recent enrolments
      prisma.enrolment.findMany({
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
        take: limit,
        select: {
          enrolment_id: true,
          created_at: true,
          learner: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          qualification: {
            select: {
              name: true,
            },
          },
          qualification_title: true,
        },
      }),
    ]);

    // Combine and format activities
    type Activity = {
      id: string;
      type: "learner" | "document" | "readiness" | "enrolment";
      title: string;
      description: string;
      timestamp: Date;
    };

    const activities: Activity[] = [];

    // Add learner activities
    for (const learner of recentLearners) {
      activities.push({
        id: `learner-${learner.learner_id}`,
        type: "learner",
        title: "Learner created",
        description: `${learner.first_name} ${learner.last_name}`,
        timestamp: learner.created_at,
      });
    }

    // Add document activities
    for (const doc of recentDocuments) {
      activities.push({
        id: `doc-${doc.document_id}`,
        type: "document",
        title: "Evidence uploaded",
        description: doc.file_name || doc.document_type || "Document",
        timestamp: doc.uploaded_at,
      });
    }

    // Add readiness activities
    for (const readiness of recentReadiness) {
      const isSubmitted = readiness.readiness_status === "SUBMITTED" || 
                         readiness.readiness_status === "UNDER_REVIEW" ||
                         readiness.readiness_status === "REVIEWED";
      activities.push({
        id: `readiness-${readiness.readiness_id}`,
        type: "readiness",
        title: isSubmitted ? "Readiness submitted" : "Readiness updated",
        description: readiness.qualification_title || "Qualification readiness",
        timestamp: readiness.submission_date || readiness.updated_at,
      });
    }

    // Add enrolment activities
    for (const enrolment of recentEnrolments) {
      activities.push({
        id: `enrolment-${enrolment.enrolment_id}`,
        type: "enrolment",
        title: "Learner enrolled",
        description: `${enrolment.learner.first_name} ${enrolment.learner.last_name} - ${enrolment.qualification?.name || enrolment.qualification_title || "Qualification"}`,
        timestamp: enrolment.created_at,
      });
    }

    // Sort by timestamp (most recent first) and limit
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const topActivities = activities.slice(0, limit);

    return NextResponse.json({
      items: topActivities.map((a) => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
