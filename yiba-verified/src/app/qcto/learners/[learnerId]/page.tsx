import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReadForQCTO } from "@/lib/api/qctoAccess";
import type { ApiContext } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { LearnerAcademicHistory } from "@/components/qcto/LearnerAcademicHistory";

interface PageProps {
  params: Promise<{ learnerId: string }>;
}

/**
 * QCTO Learner Details Page
 *
 * View learner linked to a submission (SUBMITTED, UNDER_REVIEW, or APPROVED).
 * - QCTO_USER: can view if learner is in a submission/request QCTO can access
 * - PLATFORM_ADMIN: can view any learner
 */
export default async function QCTOLearnerDetailPage({ params }: PageProps) {
  const { learnerId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!canAccessQctoData(role)) redirect("/unauthorized");

  const ctx: ApiContext = {
    userId: (session.user as { userId?: string }).userId ?? (session.user as { id?: string }).id ?? "",
    role: role!,
    institutionId: (session.user as { institutionId?: string }).institutionId ?? null,
    qctoId: (session.user as { qctoId?: string | null }).qctoId ?? null,
  };

  const canRead = await canReadForQCTO(ctx, "LEARNER", learnerId);
  if (!canRead) notFound();

  const learner = await prisma.learner.findUnique({
    where: { learner_id: learnerId, deleted_at: null },
    select: {
      learner_id: true,
      institution_id: true,
      national_id: true,
      alternate_id: true,
      first_name: true,
      last_name: true,
      birth_date: true,
      gender_code: true,
      nationality_code: true,
      home_language_code: true,
      disability_status: true,
      popia_consent: true,
      consent_date: true,
      created_at: true,
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
        },
      },
    },
  });

  if (!learner) notFound();

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
  const formatDateTime = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  return (
    <div className="space-y-6">
      <Link
        href="/qcto/submissions"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to submissions
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learner</h1>
        <p className="text-gray-600 mt-1">View learner details from a submission</p>
      </div>

      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle>
            {learner.first_name} {learner.last_name}
          </CardTitle>
          <CardDescription>
            {learner.institution?.trading_name || learner.institution?.legal_name || "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Institution</p>
              <p className="mt-0.5 flex items-center gap-2 text-[15px] text-gray-900">
                <Building2 className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                {learner.institution?.trading_name || learner.institution?.legal_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">National ID</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{learner.national_id || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Birth date</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{formatDate(learner.birth_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{learner.gender_code || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nationality</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{learner.nationality_code || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Home language</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{learner.home_language_code || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">POPIA consent</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{learner.popia_consent ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Consent date</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{formatDate(learner.consent_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{formatDateTime(learner.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <LearnerAcademicHistory learnerId={learnerId} />
    </div>
  );
}
