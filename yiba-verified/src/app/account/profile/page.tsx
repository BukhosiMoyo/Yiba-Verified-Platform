import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { ProfileForm } from "@/components/account/ProfileForm";

export default async function ProfilePage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      redirect("/login");
    }

    const userId = (session.user as any).userId;

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { user_id: userId, deleted_at: null },
        select: { first_name: true, last_name: true, email: true, emailVerified: true, image: true },
      });
    } catch (dbError) {
      console.error("DB Error fetching user:", dbError);
      throw new Error("Failed to fetch user profile from database.");
    }

    if (!user) {
      redirect("/login");
    }

    return (
      <AccountPage
        title="Profile"
        subtitle="Manage your personal information and preferences"
      >
        <AccountSection
          title="Personal Information"
          description="Update your name and contact details"
        >
          <ProfileForm
            firstName={user.first_name || ""}
            lastName={user.last_name || ""}
            email={user.email || ""}
            emailVerified={user.emailVerified}
            image={user.image}
          />
        </AccountSection>
      </AccountPage>
    );
  } catch (error: any) {
    // Re-throw redirect errors so Next.js handles them
    if (error?.message === "NEXT_REDIRECT" || error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Critical Profile Page Error:", error);

    return (
      <div className="p-8 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Unable to load profile</h2>
        <p className="text-sm text-red-500 mt-2">
          {error.message || "An unexpected error occurred."}
        </p>
        <pre className="mt-4 p-4 bg-black/5 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
        </pre>
      </div>
    );
  }
}
