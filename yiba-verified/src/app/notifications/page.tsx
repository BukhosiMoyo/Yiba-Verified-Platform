import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationsPageClient } from "./NotificationsPageClient";

/**
 * Notifications Page
 * 
 * Full page view of all notifications with filtering.
 */
export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string })?.role ?? null;
  return <NotificationsPageClient viewerRole={role} />;
}
