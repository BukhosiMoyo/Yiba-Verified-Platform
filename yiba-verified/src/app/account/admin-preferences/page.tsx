import Link from "next/link";
import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function AdminPreferencesPage() {
  return (
    <AccountPage
      title="Admin Preferences"
      subtitle="Manage your platform administrator preferences"
    >
      <AccountSection
        title="Administrator Settings"
        description="Configure your platform admin preferences and settings"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For email templates and email configuration (provider, from address, test send), use Template settings.
          </p>
          <Button variant="outline" size="sm" asChild className="border-border">
            <Link href="/account/template-settings">
              <Mail className="h-4 w-4 mr-2" />
              Open Template settings
            </Link>
          </Button>
        </div>
      </AccountSection>
    </AccountPage>
  );
}
