import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmailTemplatesTableClient } from "./EmailTemplatesTableClient";
import { EmailTemplatesPageContent } from "./EmailTemplatesPageContent";

/**
 * Platform Admin → Email Templates
 * List all email templates with name, type, trigger event, status, last updated, and actions (View / Edit / Preview).
 */
export default async function EmailTemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6 p-4 md:p-8 min-w-0 max-w-full">
      <div>
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground mt-2">
          Manage system email templates and configuration.
        </p>
      </div>

      <EmailTemplatesPageContent
        templatesTable={
          <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
            <EmailTemplatesTableClient />
          </Suspense>
        }
      />
    </div>
  );
}
