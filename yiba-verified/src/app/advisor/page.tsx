import { ServiceRequestsClient } from "@/components/platform-admin/ServiceRequestsClient";

export default function AdvisorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Service requests</h1>
        <p className="text-muted-foreground">
          Requests from the contact form. Follow up and update status when you contact the person.
        </p>
      </div>
      <ServiceRequestsClient />
    </div>
  );
}
