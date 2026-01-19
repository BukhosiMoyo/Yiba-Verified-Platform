import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SecurityPage() {
  return (
    <AccountPage
      title="Security"
      subtitle="Manage your password and security settings"
    >
      <AccountSection
        title="Change Password"
        description="Update your password to keep your account secure"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <div className="flex justify-end pt-2">
            <Button>
              Update Password
            </Button>
          </div>
        </div>
      </AccountSection>
    </AccountPage>
  );
}