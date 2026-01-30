import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { FileCheck, Pencil } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    limit?: string;
  }>;
}

/**
 * Institution Readiness List Page
 * 
 * Server Component that displays readiness records for the institution.
 * - Fetches readiness records from DB directly (read-only)
 * - Institution scoping:
 *   - INSTITUTION_* roles: locked to their institution
 *   - PLATFORM_ADMIN: sees ALL readiness records (app owners see everything! 🦸)
 * - Ignores soft-deleted readiness records
 */
export default async function InstitutionReadinessPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    deleted_at: null, // Only non-deleted readiness records
  };

  // Institution scoping - layout already ensures user has correct role
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles must be scoped to their institution
    if (userInstitutionId) {
      where.institution_id = userInstitutionId;
    } else {
      // Return empty results if no institutionId (shouldn't happen in practice)
      where.institution_id = "__NO_INSTITUTION__"; // This will return no results
    }
  }
  // PLATFORM_ADMIN sees ALL readiness records (no institution filter - app owners see everything! 🦸)

  // Filter by status if provided
  const statusParam = params.status;
  if (statusParam) {
    const validStatuses = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "RETURNED_FOR_CORRECTION", "REVIEWED", "RECOMMENDED", "REJECTED"];
    if (validStatuses.includes(statusParam)) {
      where.readiness_status = statusParam;
    }
  }

  // Parse limit
  const limit = Math.min(
    params.limit ? parseInt(params.limit, 10) : 50,
    200 // Cap at 200
  );

  // Fetch readiness records
  const readinessRecords = await prisma.readiness.findMany({
    where,
    include: {
      institution: {
        select: {
          institution_id: true,
          legal_name: true,
          trading_name: true,
        },
      },
      recommendation: {
        select: {
          recommendation_id: true,
          recommendation: true,
          remarks: true,
          created_at: true,
        },
      },
      _count: {
        select: {
          documents: true,
        },
      },
    },
    orderBy: { updated_at: "desc" },
    take: limit,
  });

  // Format status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "NOT_STARTED":
        return "outline";
      case "IN_PROGRESS":
        return "secondary";
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return "default";
      case "RECOMMENDED":
      case "REVIEWED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "RETURNED_FOR_CORRECTION":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Format status label
  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ");
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Form 5 Readiness</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Programme delivery readiness records for QCTO review
          </p>
        </div>
        <Link href="/institution/readiness/new">
          <Button>Create Readiness Record</Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
        <div className="border-b border-slate-200/80 dark:border-border bg-slate-50/30 dark:bg-muted/30 px-4 py-4 md:px-6 md:py-5">
          <h2 className="text-lg font-semibold text-foreground">Readiness Records</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {readinessRecords.length} record{readinessRecords.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="overflow-x-auto">
          {readinessRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/30 mx-4 md:mx-6 my-6 py-16">
              <EmptyState
                title="No readiness records found"
                description="Form 5 readiness records demonstrate your institution's capability to deliver a qualification. Create your first readiness record to get started."
                action={{
                  label: "Create Readiness Record",
                  href: "/institution/readiness/new",
                }}
                icon={<FileCheck className="h-6 w-6" strokeWidth={1.5} />}
              />
            </div>
          ) : (
            <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-border [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-border">
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-muted/50 border-b border-gray-200 dark:border-border hover:bg-gray-50/80 dark:hover:bg-muted/50">
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground w-12 text-center py-2.5 px-4">#</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground min-w-[180px] py-2.5 px-4">Qualification</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground py-2.5 px-4 w-[100px]">SAQA ID</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground py-2.5 px-4 w-[90px]">NQF</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground py-2.5 px-4 w-[110px]">Delivery</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground py-2.5 px-4 w-[100px]">Status</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground py-2.5 px-4 w-[90px]">Docs</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground py-2.5 px-4 w-[100px]">Updated</TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:text-muted-foreground text-right py-2.5 px-4 w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readinessRecords.map((r, i) => (
                  <TableRow key={r.readiness_id} className="group hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                    <TableCell className="text-center tabular-nums font-semibold text-gray-700 dark:text-muted-foreground py-2.5 px-4 w-12">{i + 1}</TableCell>
                    <TableCell className="font-medium text-foreground py-2.5 px-4 min-w-0 max-w-[220px] truncate" title={r.qualification_title || undefined}>
                      {r.qualification_title}
                    </TableCell>
                    <TableCell className="font-mono text-sm py-2.5 px-4">{r.saqa_id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2.5 px-4">{r.nqf_level || "—"}</TableCell>
                    <TableCell className="py-2.5 px-4">
                      <Badge variant="outline" className="text-xs">
                        {r.delivery_mode.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 px-4">
                      <Badge variant={getStatusVariant(r.readiness_status)}>
                        {formatStatus(r.readiness_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2.5 px-4">
                      {r._count.documents} {r._count.documents === 1 ? "doc" : "docs"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground py-2.5 px-4 whitespace-nowrap">
                      {formatDate(r.updated_at)}
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-right">
                      <Link
                        href={`/institution/readiness/${r.readiness_id}`}
                        className="inline-flex items-center gap-1.5 shrink-0 rounded-md border border-gray-200 dark:border-border bg-white dark:bg-background text-gray-700 dark:text-foreground hover:bg-emerald-50 hover:border-emerald-200/80 dark:hover:border-emerald-800/50 transition-colors py-2 px-3 text-sm font-medium"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                        <span>Edit</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
