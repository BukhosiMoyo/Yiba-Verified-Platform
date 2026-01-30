import { prisma } from "@/lib/prisma";

/**
 * Calculate institution trust score based on readiness history
 * 
 * Factors:
 * - Submission completeness history
 * - Approval success rate
 * - Frequency of returns
 * - Average reviewer confidence (if available)
 * 
 * Returns score 0-100
 */
export async function calculateInstitutionTrustScore(institutionId: string): Promise<{
  score: number;
  trend: "UP" | "DOWN" | "STABLE";
  explanation: string;
  factors: {
    submission_completeness_avg: number;
    approval_success_rate: number;
    return_frequency: number;
    avg_reviewer_confidence: number | null;
  };
}> {
  // Fetch all readiness records for this institution (excluding drafts)
  const readinessRecords = await prisma.readiness.findMany({
    where: {
      institution_id: institutionId,
      deleted_at: null,
      readiness_status: {
        notIn: ["NOT_STARTED", "IN_PROGRESS"],
      },
    },
    include: {
      recommendation: {
        select: {
          recommendation: true,
          reviewer_confidence: true,
        },
      },
      sectionReviews: {
        select: {
          response: true,
        },
      },
    },
  });

  if (readinessRecords.length === 0) {
    // No submissions yet - neutral score
    return {
      score: 50,
      trend: "STABLE",
      explanation: "No readiness submissions yet. Score will be calculated after first submission.",
      factors: {
        submission_completeness_avg: 0,
        approval_success_rate: 0,
        return_frequency: 0,
        avg_reviewer_confidence: null,
      },
    };
  }

  // Calculate submission completeness (based on section_completion_data)
  let totalCompleteness = 0;
  let completenessCount = 0;
  for (const record of readinessRecords) {
    if (record.section_completion_data && typeof record.section_completion_data === "object") {
      const completionData = record.section_completion_data as Record<string, { completed?: number }>;
      const sections = Object.values(completionData);
      if (sections.length > 0) {
        const avgCompletion = sections.reduce((sum, s) => sum + (s.completed || 0), 0) / sections.length;
        totalCompleteness += avgCompletion;
        completenessCount++;
      }
    }
  }
  const submissionCompletenessAvg = completenessCount > 0 ? totalCompleteness / completenessCount : 0;

  // Calculate approval success rate
  const approved = readinessRecords.filter(
    (r) => r.readiness_status === "RECOMMENDED" || r.recommendation?.recommendation === "RECOMMENDED"
  ).length;
  const rejected = readinessRecords.filter(
    (r) => r.readiness_status === "REJECTED" || r.recommendation?.recommendation === "NOT_RECOMMENDED"
  ).length;
  const totalDecided = approved + rejected;
  const approvalSuccessRate = totalDecided > 0 ? (approved / totalDecided) * 100 : 0;

  // Calculate return frequency (percentage of submissions that were returned)
  const returned = readinessRecords.filter((r) => r.readiness_status === "RETURNED_FOR_CORRECTION").length;
  const returnFrequency = (returned / readinessRecords.length) * 100;

  // Calculate average reviewer confidence
  const confidenceScores = readinessRecords
    .map((r) => r.recommendation?.reviewer_confidence)
    .filter((c): c is number => c !== null && c !== undefined);
  const avgReviewerConfidence = confidenceScores.length > 0
    ? confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
    : null;

  // Calculate weighted score (0-100)
  // Weights: completeness 30%, approval rate 40%, return frequency -20%, confidence 10%
  let score = 0;
  score += (submissionCompletenessAvg / 100) * 30; // Completeness (0-30 points)
  score += (approvalSuccessRate / 100) * 40; // Approval rate (0-40 points)
  score -= (returnFrequency / 100) * 20; // Return frequency (penalty, -20 to 0 points)
  score += avgReviewerConfidence ? (avgReviewerConfidence / 100) * 10 : 5; // Confidence (0-10 points, default 5 if not available)

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine trend (compare to previous calculation if available)
  const existingScore = await prisma.institutionTrustScore.findUnique({
    where: { institution_id: institutionId },
  });

  let trend: "UP" | "DOWN" | "STABLE" = "STABLE";
  if (existingScore) {
    if (score > existingScore.score + 5) {
      trend = "UP";
    } else if (score < existingScore.score - 5) {
      trend = "DOWN";
    }
  }

  // Generate explanation
  let explanation = `Trust score based on ${readinessRecords.length} submission(s). `;
  if (approvalSuccessRate >= 80) {
    explanation += "Excellent approval rate. ";
  } else if (approvalSuccessRate >= 60) {
    explanation += "Good approval rate. ";
  } else if (approvalSuccessRate >= 40) {
    explanation += "Moderate approval rate. ";
  } else {
    explanation += "Low approval rate. ";
  }
  if (returnFrequency < 10) {
    explanation += "Low return frequency. ";
  } else if (returnFrequency < 25) {
    explanation += "Moderate return frequency. ";
  } else {
    explanation += "High return frequency. ";
  }
  if (submissionCompletenessAvg >= 90) {
    explanation += "High submission completeness.";
  } else if (submissionCompletenessAvg >= 70) {
    explanation += "Good submission completeness.";
  } else {
    explanation += "Submission completeness needs improvement.";
  }

  return {
    score,
    trend,
    explanation,
    factors: {
      submission_completeness_avg: Math.round(submissionCompletenessAvg),
      approval_success_rate: Math.round(approvalSuccessRate),
      return_frequency: Math.round(returnFrequency),
      avg_reviewer_confidence: avgReviewerConfidence ? Math.round(avgReviewerConfidence) : null,
    },
  };
}

/**
 * Get or calculate institution trust score
 * Updates the database with the calculated score
 */
export async function getOrCalculateTrustScore(institutionId: string) {
  // Check if score exists and is recent (within 24 hours)
  const existing = await prisma.institutionTrustScore.findUnique({
    where: { institution_id: institutionId },
  });

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (existing && existing.last_calculated > oneDayAgo) {
    // Return cached score
    return {
      score: existing.score,
      trend: (existing.trend as "UP" | "DOWN" | "STABLE") || "STABLE",
      explanation: existing.explanation || "",
      factors: (existing.factors as any) || {},
    };
  }

  // Calculate new score
  const calculated = await calculateInstitutionTrustScore(institutionId);

  // Update or create in database
  await prisma.institutionTrustScore.upsert({
    where: { institution_id: institutionId },
    update: {
      score: calculated.score,
      trend: calculated.trend,
      explanation: calculated.explanation,
      factors: calculated.factors,
      last_calculated: now,
    },
    create: {
      institution_id: institutionId,
      score: calculated.score,
      trend: calculated.trend,
      explanation: calculated.explanation,
      factors: calculated.factors,
      last_calculated: now,
    },
  });

  return calculated;
}
