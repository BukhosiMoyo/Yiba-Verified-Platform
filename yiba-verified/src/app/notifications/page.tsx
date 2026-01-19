import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { NotificationList } from "@/components/shared/NotificationList";

interface PageProps {
  searchParams: Promise<{
    is_read?: string;
    limit?: string;
    offset?: string;
  }>;
}

/**
 * Notifications Page
 * 
 * Displays all notifications for the current user.
 */
export default async function NotificationsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your notifications
        </p>
      </div>

      <NotificationList
        initialFilters={{
          is_read: params.is_read || undefined,
          limit: params.limit || undefined,
          offset: params.offset || undefined,
        }}
      />
    </div>
  );
}
