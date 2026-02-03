import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmailSettingsSection } from "@/components/settings/EmailSettingsSection";
import { EmailLogsTableClient } from "./EmailLogsTableClient";

/**
 * Platform Admin → Email Settings
 * Provider status, sender/reply-to, test email, email sending logs, retry failed invites.
 */
export default async function EmailSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-8 p-4 md:p-8 min-w-0 max-w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure platform-wide email templates, providers, and view sending logs.
        </p>
      </div>

      <div className="grid gap-8">
        <EmailSettingsSection />
        <EmailLogsTableClient />
      </div>
    </div>
  );
}
