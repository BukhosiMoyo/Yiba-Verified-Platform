import { AccountPage, AccountSection } from "@/components/account/AccountPage";

export default function ScopeAssignmentsPage() {
  return (
    <AccountPage
      title="Scope / Assignments"
      subtitle="Manage your QCTO scope and assignment preferences"
    >
      <AccountSection
        title="Scope & Assignments"
        description="Configure your QCTO scope and assignment settings"
      >
        <div className="text-center py-12 text-gray-500">
          <p>Scope and assignments settings coming soon.</p>
        </div>
      </AccountSection>
    </AccountPage>
  );
}