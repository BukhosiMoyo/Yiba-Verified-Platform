import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { EmailTemplatesSection } from "@/components/settings/EmailTemplatesSection";
import { EmailSettingsSection } from "@/components/settings/EmailSettingsSection";

export default async function TemplateSettingsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isPlatformAdmin = role === "PLATFORM_ADMIN";

  return (
    <AccountPage
      title="Template settings"
      subtitle="Manage email templates and see the exact content that gets sent. Edit subject, body, and placeholders in one place."
    >
      <AccountSection
        title="Email templates"
        description="View all templates, edit subject and body text, and use placeholders (e.g. {{recipient_name}}, {{institution_name}}). Changes apply to future emails."
      >
        <EmailTemplatesSection />
      </AccountSection>

      {isPlatformAdmin && (
        <AccountSection
          title="Email configuration"
          description="Current provider and from address. Send a test email to verify delivery."
        >
          <EmailSettingsSection />
        </AccountSection>
      )}
    </AccountPage>
  );
}
