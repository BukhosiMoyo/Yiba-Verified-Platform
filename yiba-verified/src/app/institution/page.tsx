import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

  return (
    <InstitutionDashboardClient
      greeting={greeting}
      userName={userName}
      todayDate={todayDate}
    />
  );
}
