import { AccountPage, AccountSection } from "@/components/account/AccountPage";

export default function LogsPage() {
  return (
    <AccountPage
      title="Activity Logs"
      subtitle="View your account activity and access history"
    >
      <AccountSection
        title="Recent Activity"
        description="Your recent account activity and access logs"
      >
        <div className="text-center py-12 text-gray-500">
          <p>No activity logs available at this time.</p>
        </div>
      </AccountSection>
    </AccountPage>
  );
}