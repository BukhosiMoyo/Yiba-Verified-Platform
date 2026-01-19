import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  return (
    <AccountPage
      title="Notifications"
      subtitle="Manage your notification preferences"
    >
      <AccountSection
        title="Email Notifications"
        description="Choose what email notifications you want to receive"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-updates">System Updates</Label>
              <p className="text-sm text-gray-500">
                Receive updates about system changes and maintenance
              </p>
            </div>
            <Switch id="email-updates" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-activity">Account Activity</Label>
              <p className="text-sm text-gray-500">
                Get notified about important account activity
              </p>
            </div>
            <Switch id="email-activity" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-marketing">Marketing Emails</Label>
              <p className="text-sm text-gray-500">
                Receive updates about new features and tips
              </p>
            </div>
            <Switch id="email-marketing" />
          </div>
          <div className="flex justify-end pt-2">
            <Button>
              Save Preferences
            </Button>
          </div>
        </div>
      </AccountSection>
    </AccountPage>
  );
}