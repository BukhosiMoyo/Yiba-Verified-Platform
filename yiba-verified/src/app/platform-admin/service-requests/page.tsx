import { ServiceRequestsClient } from "@/components/platform-admin/ServiceRequestsClient";
import { Inbox } from "lucide-react";

export default function PlatformAdminServiceRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Inbox className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Service requests</h1>
        </div>
        <p className="text-muted-foreground">
          Requests from the contact form (accreditation help, accounting, websites, etc.). Assign advisors in Users to route by type.
        </p>
      </div>
      <ServiceRequestsClient />
    </div>
  );
}
