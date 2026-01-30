import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import {
  fetchInstitutionActivity,
  fetchInstitutionDashboard,
} from "@/lib/institution-dashboard-data";
import { InstitutionDashboardClient } from "./InstitutionDashboardClient";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTodayDate() {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export default async function InstitutionDashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || "there";
  const greeting = getGreeting();
  const todayDate = formatTodayDate();

  let institutionId: string | null = null;
  const role = session?.user?.role;
  if (
    session?.user?.userId &&
    (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF")
  ) {
    const cookieStore = await cookies();
    const preferredId = cookieStore.get("current_institution_id")?.value ?? null;
    const resolved = await getCurrentInstitutionForUser(
      session.user.userId,
      preferredId
    );
    institutionId = resolved.currentInstitutionId;
  } else if (session?.user?.institutionId) {
    institutionId = session.user.institutionId as string;
  }

  if (!institutionId) {
    return (
      <InstitutionDashboardClient
        greeting={greeting}
        userName={userName}
        todayDate={todayDate}
        activities={[]}
        metrics={null}
        recentLearners={[]}
      />
    );
  }

  const [activityRes, dashboardRes] = await Promise.all([
    fetchInstitutionActivity(institutionId),
    fetchInstitutionDashboard(institutionId),
  ]);

  return (
    <InstitutionDashboardClient
      greeting={greeting}
      userName={userName}
      todayDate={todayDate}
      activities={activityRes.items}
      metrics={dashboardRes.metrics}
      recentLearners={dashboardRes.recentLearners}
    />
  );
}
