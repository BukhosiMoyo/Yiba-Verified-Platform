import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin - Yiba Verified",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has admin role
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const allowedRoles = ["PLATFORM_ADMIN", "QCTO_ADMIN", "QCTO_SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar user={session.user} />
      <main className="flex-1 overflow-auto scrollbar-hidden">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
