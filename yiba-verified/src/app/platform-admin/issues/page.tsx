import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IssuesPageClient } from "./IssuesPageClient";

export const metadata = {
  title: "Issue Reports | Platform Admin",
  description: "Manage issue reports from users",
};

export default async function IssuesPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <Suspense fallback={<IssuesPageSkeleton />}>
      <IssuesPageClient />
    </Suspense>
  );
}

function IssuesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="border rounded-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 border-b last:border-b-0"
          >
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
