import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TwoFactorSettings } from "@/components/account/TwoFactorSettings";
import { Label } from "@/components/ui/label";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { two_factor_enabled: true }
  });

  return (
    <AccountPage
      title="Security"
      subtitle="Manage your password and security settings"
    >
      <AccountSection
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <TwoFactorSettings initialEnabled={user?.two_factor_enabled ?? false} />
      </AccountSection>

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