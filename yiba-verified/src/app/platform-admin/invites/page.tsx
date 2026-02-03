import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InvitesPageClient from "./InvitesPageClient";

export default async function InvitesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    // RBAC check if needed (Invites likely Platform Admin or Institution Admin)
    if (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "INSTITUTION_ADMIN") {
        redirect("/unauthorized");
    }

    // Fetch institutions for the dropdown
    // If Institution Admin, they might only see their own? For now, mimicking Users user flow (platform admin sees all)
    // Or if Institution Admin, we might filter. But for manual invite, logic handles filtering.
    // Let's fetch all for Platform Admin.

    // Note: if lists get huge, searchable select helps, but initial fetch might be heavy.
    const institutions = await prisma.institution.findMany({
        where: { deleted_at: null },
        select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
        },
        orderBy: { legal_name: "asc" },
        take: 1000,
    });

    return <InvitesPageClient institutions={institutions} />;
}
