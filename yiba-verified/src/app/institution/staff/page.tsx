import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/EmptyState";
import { InstitutionStaffClient } from "@/components/institution/InstitutionStaffClient";
import { Users } from "lucide-react";

/**
 * Institution Staff Page
 *
 * Lists users belonging to the institution. INSTITUTION_ADMIN can add (invite)
 * and disable/enable staff.
 */
export default async function InstitutionStaffPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userInstitutionId = session.user.institutionId;

  if (!userInstitutionId) {
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-8 md:p-12">
          <EmptyState
            title="No institution"
            description="Your account is not linked to an institution. Contact an administrator."
            icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
            variant="default"
          />
        </div>
      </div>
    );
  }

  const staff = await prisma.user.findMany({
    where: {
      deleted_at: null,
      OR: [
        { institution_id: userInstitutionId },
        { userInstitutions: { some: { institution_id: userInstitutionId } } },
      ],
    },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      role: true,
      status: true,
      created_at: true,
      userInstitutions: {
        where: { institution_id: userInstitutionId },
        select: { can_facilitate: true, can_assess: true, can_moderate: true },
      },
    },
    orderBy: [{ role: "asc" }, { last_name: "asc" }, { first_name: "asc" }],
  });

  const staffWithUi = staff.map((u) => {
    const { userInstitutions, ...rest } = u;
    return {
      ...rest,
      can_facilitate: userInstitutions[0]?.can_facilitate ?? false,
      can_assess: userInstitutions[0]?.can_assess ?? false,
      can_moderate: userInstitutions[0]?.can_moderate ?? false,
    };
  });

  const canManage = session.user.role === "INSTITUTION_ADMIN";
  const currentUserId = session.user.userId;
  const currentUserRole = session.user.role;

  return (
    <div className="space-y-6 md:space-y-10 p-4 md:p-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-800 px-6 py-8 md:px-8 md:py-10 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Users className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Staff</h1>
            <p className="mt-2 text-violet-100 text-sm md:text-base">
              People with access to your institution
            </p>
          </div>
        </div>
      </div>

      <InstitutionStaffClient staff={staffWithUi} canManage={canManage} currentUserId={currentUserId} currentUserRole={currentUserRole} />
    </div>
  );
}
