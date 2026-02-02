import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { ProfileForm } from "@/components/account/ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { user_id: session.user.userId, deleted_at: null },
    select: { first_name: true, last_name: true, email: true, emailVerified: true, image: true },
  });

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
          firstName={user.first_name}
          lastName={user.last_name}
          email={user.email}
          emailVerified={user.emailVerified}
          image={user.image}
        />
      </AccountSection>
    </AccountPage>
  );
}
