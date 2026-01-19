import { AccountPage, AccountSection } from "@/components/account/AccountPage";

export default function AcademicProfilePage() {
  return (
    <AccountPage
      title="Academic Profile"
      subtitle="Manage your academic information and records"
    >
      <AccountSection
        title="Academic Information"
        description="View and manage your academic profile"
      >
        <div className="text-center py-12 text-gray-500">
          <p>Academic profile settings coming soon.</p>
        </div>
      </AccountSection>
    </AccountPage>
  );
}