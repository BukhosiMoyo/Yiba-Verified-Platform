import { AccountPage, AccountSection } from "@/components/account/AccountPage";

export default function OrganisationPage() {
  return (
    <AccountPage
      title="Organisation"
      subtitle="Manage your institution profile and settings"
    >
      <AccountSection
        title="Institution Information"
        description="View and manage your organisation details"
      >
        <div className="text-center py-12 text-gray-500">
          <p>Organisation settings coming soon.</p>
        </div>
      </AccountSection>
    </AccountPage>
  );
}