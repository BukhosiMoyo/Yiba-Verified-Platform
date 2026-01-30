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
        <h1 className="text-3xl font-bold">Email Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure sender, reply-to, send test emails, and view sending logs.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Configuration</h2>
        <EmailSettingsSection />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Email sending logs</h2>
        <p className="text-sm text-muted-foreground">
          Recent invite email attempts (sent / failed). Use &quot;Retry failed invites&quot; to requeue failed invites for resending.
        </p>
        <EmailLogsTableClient />
      </section>
    </div>
  );
}
