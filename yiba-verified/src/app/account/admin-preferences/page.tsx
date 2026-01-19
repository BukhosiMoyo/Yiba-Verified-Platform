import { AccountPage, AccountSection } from "@/components/account/AccountPage";

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
        <div className="text-center py-12 text-gray-500">
          <p>Admin preferences coming soon.</p>
        </div>
      </AccountSection>
    </AccountPage>
  );
}