import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FacilitatorProfileClient } from "@/components/institution/FacilitatorProfileClient";
import { GraduationCap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { computeFacilitatorProfileCompleteness } from "@/lib/facilitatorProfileCompleteness";

/**
 * Facilitator profile page: for users with can_facilitate at their institution.
 * They complete QCTO-required fields and upload CV/contract so they can be selected in Form 5.
 */
export default async function FacilitatorProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.userId ?? (session.user as any).id;
  const institutionId = session.user.institutionId;
  const role = session.user.role;

  const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
  if (!userId || !institutionId || !allowedRoles.includes(role)) {
    redirect("/institution");
  }

  const ui = await prisma.userInstitution.findUnique({
    where: {
      user_id_institution_id: { user_id: userId, institution_id: institutionId },
    },
  });

  if (!ui?.can_facilitate) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <Button variant="outline" asChild>
          <Link href="/institution/staff">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Staff
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              Facilitator profile
            </CardTitle>
            <CardDescription>
              You are not marked as a facilitator for this institution. Ask an institution admin to enable &quot;Facilitator&quot; for you on the Staff page, then you can complete your profile here.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { user_id: userId, deleted_at: null },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      facilitator_id_number: true,
      facilitator_qualifications: true,
      facilitator_industry_experience: true,
      facilitator_profile_complete: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const profileDocs = await prisma.document.findMany({
    where: {
      related_entity: "USER_FACILITATOR_PROFILE",
      related_entity_id: userId,
    },
    select: {
      document_id: true,
      document_type: true,
      file_name: true,
      uploaded_at: true,
    },
  });

  const { percentage, complete } = await computeFacilitatorProfileCompleteness(userId);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/institution/staff">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Staff
          </Link>
        </Button>
      </div>
      <FacilitatorProfileClient
        profile={{
          ...user!,
          facilitatorProfileDocuments: profileDocs,
          completeness_percentage: percentage,
          completeness_complete: complete,
        }}
        institutionId={institutionId}
      />
    </div>
  );
}
