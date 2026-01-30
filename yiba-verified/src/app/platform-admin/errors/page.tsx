import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ limit?: string; offset?: string }>;
}

/**
 * Platform Admin Client Errors Page
 *
 * Lists client-side errors reported by the error boundary.
 * Only PLATFORM_ADMIN can access.
 */
export default async function PlatformAdminErrorsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const limit = Math.min(parseInt(params.limit || "50"), 200);
  const offset = parseInt(params.offset || "0");

  let items: Awaited<
    ReturnType<
      typeof prisma.clientErrorReport.findMany<{
        include: { user: { select: { email: true; first_name: true; last_name: true } } };
      }>
    >
  > = [];
  let total = 0;

  try {
    [items, total] = await Promise.all([
      prisma.clientErrorReport.findMany({
        take: limit,
        skip: offset,
        orderBy: { created_at: "desc" },
        include: {
          user: {
            select: { email: true, first_name: true, last_name: true },
          },
        },
      }),
      prisma.clientErrorReport.count(),
    ]);
  } catch {
    items = [];
    total = 0;
  }

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("en-ZA", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(d));

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Client Errors</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Errors reported when users hit the application error boundary
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/platform-admin" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="bg-card rounded-xl border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">All reported errors</CardTitle>
          <CardDescription className="text-muted-foreground">
            {total} total · Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title="No errors reported"
              description="Client errors from the error boundary will appear here."
              icon={<AlertCircle className="h-6 w-6" strokeWidth={1.5} />}
              variant="no-results"
              className="border-0 bg-transparent py-12"
            />
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Time</TableHead>
                    <TableHead className="text-muted-foreground">Message</TableHead>
                    <TableHead className="text-muted-foreground">Path</TableHead>
                    <TableHead className="text-muted-foreground">Digest</TableHead>
                    <TableHead className="text-muted-foreground">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((err) => (
                    <TableRow
                      key={err.id}
                      className="border-b border-border/60 hover:bg-muted/50"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap py-3">
                        {formatDate(err.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-foreground max-w-md truncate py-3" title={err.message}>
                        {err.message}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[200px] py-3" title={err.path ?? ""}>
                        {err.path ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[120px] py-3" title={err.digest ?? ""}>
                        {err.digest ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3">
                        {err.user
                          ? `${err.user.first_name} ${err.user.last_name}`.trim() || err.user.email
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}

          {total > limit && (
            <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <div className="flex gap-2">
                {offset > 0 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/platform-admin/errors?limit=${limit}&offset=${Math.max(0, offset - limit)}`}>
                      Previous
                    </Link>
                  </Button>
                )}
                {offset + limit < total && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/platform-admin/errors?limit=${limit}&offset=${offset + limit}`}>
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
