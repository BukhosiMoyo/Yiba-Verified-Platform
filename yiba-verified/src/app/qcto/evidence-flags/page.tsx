import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasCap } from "@/lib/capabilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { EvidenceFlagsToolbar } from "@/components/qcto/EvidenceFlagsToolbar";
import { EvidenceFlagsDisplay } from "@/components/qcto/EvidenceFlagsDisplay";
import { Flag } from "lucide-react";
import type { Prisma } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; view?: string; limit?: string }>;
}

/**
 * QCTO Evidence Flags Page
 *
 * Lists documents flagged by QCTO for attention.
 * - Requires EVIDENCE_VIEW
 * - QCTO_USER and PLATFORM_ADMIN can access
 */
export default async function QCTOEvidenceFlagsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;

  if (userRole !== "QCTO_USER" && userRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  if (!hasCap(userRole, "EVIDENCE_VIEW")) {
    redirect("/unauthorized");
  }

  const statusParam = params.status;
  const q = (params.q || "").trim();
  const view = (params.view === "grid" ? "grid" : "list") as "list" | "grid";

  const where: Prisma.EvidenceFlagWhereInput = {};
  if (statusParam && ["ACTIVE", "RESOLVED"].includes(statusParam)) {
    where.status = statusParam;
  }
  if (q.length > 0) {
    where.OR = [
      { reason: { contains: q, mode: "insensitive" } },
      { document: { file_name: { contains: q, mode: "insensitive" } } },
      {
        flaggedByUser: {
          OR: [
            { first_name: { contains: q, mode: "insensitive" } },
            { last_name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const limit = Math.min(params.limit ? parseInt(params.limit, 10) : 50, 200);

  const flags = await prisma.evidenceFlag.findMany({
    where,
    select: {
      flag_id: true,
      reason: true,
      status: true,
      created_at: true,
      resolved_at: true,
      flaggedByUser: { select: { first_name: true, last_name: true, email: true } },
      resolvedByUser: { select: { first_name: true, last_name: true } },
      document: {
        select: {
          document_id: true,
          file_name: true,
          document_type: true,
          mime_type: true,
          status: true,
          related_entity: true,
          institution: { select: { institution_id: true, legal_name: true, trading_name: true } },
          enrolment: {
            select: { institution: { select: { legal_name: true, trading_name: true } } },
          },
          learner: {
            select: { institution: { select: { legal_name: true, trading_name: true } } },
          },
          readiness: {
            select: { institution: { select: { legal_name: true, trading_name: true } } },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Evidence Flags</h1>
        <p className="text-muted-foreground mt-2">
          Documents flagged by QCTO for review or follow-up
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>All Flags</CardTitle>
            <CardDescription>
              {flags.length} flag{flags.length !== 1 ? "s" : ""} found
              {statusParam && ` with status "${statusParam}"`}
              {q && ` matching "${q}"`}
            </CardDescription>
          </div>
          <EvidenceFlagsToolbar q={params.q || ""} status={statusParam || ""} view={view} />
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <EmptyState
              title="No evidence flags"
              description="Documents flagged for review will appear here."
              icon={<Flag className="h-8 w-8 text-gray-400" strokeWidth={1.5} />}
            />
          ) : (
            <EvidenceFlagsDisplay view={view} flags={flags} userRole={userRole} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
