import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { type NavItem } from "@/components/layout/nav";
import { prisma } from "@/lib/prisma";

const FACILITATOR_NAVIGATION: NavItem[] = [
    { label: "Dashboard", href: "/facilitator/dashboard", iconKey: "layout-dashboard" },
    { label: "My Profile", href: "/facilitator/profile", iconKey: "user" },
    { label: "Assessments", href: "/facilitator/assessments", iconKey: "file-text" },
    { label: "Schedule", href: "/facilitator/schedule", iconKey: "calendar" },
    { label: "Settings", href: "/account", iconKey: "settings" },
];

export default async function FacilitatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    // Double check role access
    // Double check role access
    if (session.user.role !== "FACILITATOR" && session.user.role !== "PLATFORM_ADMIN") {
        redirect("/unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { user_id: session.user.userId },
        select: { image: true },
    });

    return (
        <AppShell
            navigationItems={FACILITATOR_NAVIGATION}
            currentUserRole="FACILITATOR" // Display as Facilitator context
            userName={session.user.name || "Facilitator"}
            userId={session.user.userId}
            userImage={user?.image || null}
            viewingAsUserId={null}
            viewingAsRole={null}
            viewingAsUserName={null}
            originalUserName={undefined}
            originalRole={undefined}
            institutions={[]} // Facilitators might belong to institutions, but the switcher might not be needed or implemented yet
            currentInstitutionId={null}
        >
            {children}
        </AppShell>
    );
}
