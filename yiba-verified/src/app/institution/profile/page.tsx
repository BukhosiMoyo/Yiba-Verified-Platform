import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Building2, MapPin, Mail, Phone, User, Hash } from "lucide-react";

/**
 * Institution Profile Page
 *
 * Displays the current user's institution details (read-only).
 * - INSTITUTION_*: must have institutionId, fetches their institution
 * - PLATFORM_ADMIN: not typically on this route; if so, would need to pick an institution
 */
export default async function InstitutionProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userInstitutionId = session.user.institutionId;

  if (!userInstitutionId) {
    redirect("/unauthorized");
  }

  const institution = await prisma.institution.findUnique({
    where: { institution_id: userInstitutionId },
    select: {
      institution_id: true,
      legal_name: true,
      trading_name: true,
      institution_type: true,
      registration_number: true,
      physical_address: true,
      postal_address: true,
      province: true,
      delivery_modes: true,
      status: true,
      contact_person_name: true,
      contact_email: true,
      contact_number: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!institution) {
    notFound();
  }

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const modeLabels: Record<string, string> = {
    FACE_TO_FACE: "Face to face",
    BLENDED: "Blended",
    MOBILE: "Mobile",
  };
  const deliveryModes = (institution.delivery_modes || [])
    .map((m: string) => modeLabels[m] || m)
    .join(", ") || "—";
  const typeLabels: Record<string, string> = {
    TVET: "TVET",
    PRIVATE_SDP: "Private SDP",
    NGO: "NGO",
    UNIVERSITY: "University",
    OTHER: "Other",
  };
  const institutionType = typeLabels[institution.institution_type] || institution.institution_type;

  const statusStyles = {
    APPROVED: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800/50",
    DRAFT: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800/50",
    SUSPENDED: "bg-rose-500/10 text-rose-700 border-rose-200 dark:border-rose-800/50",
  };
  const statusClass = statusStyles[institution.status as keyof typeof statusStyles] ?? "bg-slate-500/10 text-slate-700 border-slate-200";

  return (
    <div className="space-y-6 md:space-y-10 p-4 md:p-8">
      {/* Header with modern gradient accent */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 md:px-8 md:py-10 text-white shadow-xl border border-slate-700/50">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-emerald-600/10" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]" aria-hidden />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Institution Profile</h1>
          <p className="mt-2 text-slate-300 text-sm md:text-base">
            Your organisation&apos;s details as registered
          </p>
        </div>
      </div>

      {/* Main card with status-coloured accent */}
      <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${institution.status === "APPROVED" ? "border-l-4 border-l-emerald-500" : institution.status === "DRAFT" ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-slate-300"}`}>
        {/* Card header */}
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-6 py-5 md:px-8 md:py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Building2 className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                  {institution.trading_name || institution.legal_name}
                </h2>
                {institution.legal_name !== (institution.trading_name || "") && (
                  <p className="mt-0.5 text-sm text-slate-500">{institution.legal_name}</p>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-semibold ${statusClass}`}>
              {institution.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8 md:py-8 space-y-8">
          {/* Core details – slate tint */}
          <section className="rounded-xl bg-slate-50/60 border border-slate-200/80 p-4 md:p-5 dark:bg-slate-900/20 dark:border-slate-700/50">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">Registration & type</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-500" /> Registration number
                </p>
                <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{institution.registration_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Type</p>
                <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{institutionType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Delivery modes</p>
                <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{deliveryModes}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Province</p>
                <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{institution.province}</p>
              </div>
            </div>
          </section>

          {/* Address – emerald tint */}
          <section className="rounded-xl bg-emerald-50/50 border border-emerald-100/80 p-4 md:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700/90 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500" /> Address
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-emerald-700/80">Physical address</p>
                <p className="mt-1 text-base text-slate-800 whitespace-pre-wrap">{institution.physical_address || "—"}</p>
              </div>
              {institution.postal_address && (
                <div>
                  <p className="text-sm font-medium text-emerald-700/80">Postal address</p>
                  <p className="mt-1 text-base text-slate-800 whitespace-pre-wrap">{institution.postal_address}</p>
                </div>
              )}
            </div>
          </section>

          {/* Contact – amber/rose tint */}
          <section className="rounded-xl bg-amber-50/50 border border-amber-100/80 p-4 md:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-800/90 mb-4">Contact</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-amber-800/80 flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-600" /> Contact person
                </p>
                <p className="mt-1 text-base font-medium text-slate-900">{institution.contact_person_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800/80 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-600" /> Contact email
                </p>
                <p className="mt-1 text-base">
                  {institution.contact_email ? (
                    <a href={`mailto:${institution.contact_email}`} className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded">
                      {institution.contact_email}
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800/80 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-600" /> Contact number
                </p>
                <p className="mt-1 text-base font-medium text-slate-900">{institution.contact_number || "—"}</p>
              </div>
            </div>
          </section>

          {/* Footer meta */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200/80">
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Created {formatDate(institution.created_at)}
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Updated {formatDate(institution.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
