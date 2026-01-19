import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  return (
    <AccountPage
      title="Profile"
      subtitle="Manage your personal information and preferences"
    >
      <AccountSection
        title="Personal Information"
        description="Update your name and contact details"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Input id="email" type="email" placeholder="john@example.com" />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Verified
              </Badge>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button>
              Save Changes
            </Button>
          </div>
        </div>
      </AccountSection>
    </AccountPage>
  );
}