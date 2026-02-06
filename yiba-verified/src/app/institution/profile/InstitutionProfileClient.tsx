"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Building2, MapPin, Mail, Phone, User, Hash, Pencil, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type DeliveryMode = "FACE_TO_FACE" | "BLENDED" | "MOBILE";

interface InstitutionProfile {
    institution_id: string;
    legal_name: string;
    trading_name: string | null;
    institution_type: string;
    registration_number: string;
    physical_address: string;
    postal_address: string | null;
    province: string;
    delivery_modes: DeliveryMode[];
    status: string;
    contact_person_name: string | null;
    contact_email: string | null;
    contact_number: string | null;
    created_at: Date;
    updated_at: Date;
}

interface FormData {
    contact_person_name: string;
    contact_email: string;
    contact_number: string;
    physical_address: string;
    postal_address: string;
    delivery_modes: DeliveryMode[];
}

export function InstitutionProfileClient({ canEdit }: { canEdit: boolean }) {
    const [institution, setInstitution] = useState<InstitutionProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormData>();

    const deliveryModesValue = watch("delivery_modes", []);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            setIsLoading(true);
            const res = await fetch("/api/institution/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            const data = await res.json();
            setInstitution(data);
            reset({
                contact_person_name: data.contact_person_name || "",
                contact_email: data.contact_email || "",
                contact_number: data.contact_number || "",
                physical_address: data.physical_address || "",
                postal_address: data.postal_address || "",
                delivery_modes: data.delivery_modes || [],
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load institution profile");
        } finally {
            setIsLoading(false);
        }
    }

    async function onSubmit(data: FormData) {
        try {
            setIsSaving(true);
            const res = await fetch("/api/institution/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to update profile");
            }

            const updated = await res.json();
            setInstitution(updated);
            setIsEditing(false);
            toast.success("Institution profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    }

    function handleCancel() {
        if (institution) {
            reset({
                contact_person_name: institution.contact_person_name || "",
                contact_email: institution.contact_email || "",
                contact_number: institution.contact_number || "",
                physical_address: institution.physical_address || "",
                postal_address: institution.postal_address || "",
                delivery_modes: institution.delivery_modes || [],
            });
        }
        setIsEditing(false);
    }

    const formatDate = (d: Date | null) =>
        d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—";

    const modeLabels: Record<string, string> = {
        FACE_TO_FACE: "Face to face",
        BLENDED: "Blended",
        MOBILE: "Mobile",
    };

    const typeLabels: Record<string, string> = {
        TVET: "TVET",
        PRIVATE_SDP: "Private SDP",
        NGO: "NGO",
        UNIVERSITY: "University",
        OTHER: "Other",
    };

    const statusStyles = {
        APPROVED: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800/50",
        DRAFT: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800/50",
        SUSPENDED: "bg-rose-500/10 text-rose-700 border-rose-200 dark:border-rose-800/50",
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!institution) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-600">Failed to load institution profile</p>
            </div>
        );
    }

    const institutionType = typeLabels[institution.institution_type] || institution.institution_type;
    const statusClass = statusStyles[institution.status as keyof typeof statusStyles] ?? "bg-slate-500/10 text-slate-700 border-slate-200";

    return (
        <div className="space-y-6 md:space-y-10 p-4 md:p-8">
            {/* Header with modern gradient accent */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-900 px-6 py-8 md:px-8 md:py-10 text-white shadow-2xl border border-indigo-700/50">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-indigo-600/20" aria-hidden />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.2),transparent_50%)]" aria-hidden />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]" aria-hidden />
                <div className="relative">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Institution Profile</h1>
                    <p className="mt-2 text-indigo-100 text-sm md:text-base">
                        Manage your organisation&apos;s details and contact information
                    </p>
                </div>
            </div>

            {/* Main card with status-colored accent */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all duration-300 ${institution.status === "APPROVED" ? "border-l-4 border-l-emerald-500" : institution.status === "DRAFT" ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-slate-300"}`}>
                    {/* Card header */}
                    <div className="border-b border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 px-6 py-5 md:px-8 md:py-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 shadow-sm">
                                    <Building2 className="h-6 w-6" strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        {institution.trading_name || institution.legal_name}
                                    </h2>
                                    {institution.legal_name !== (institution.trading_name || "") && (
                                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{institution.legal_name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-semibold ${statusClass}`}>
                                    {institution.status}
                                </span>
                                {canEdit && !isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        <span className="hidden sm:inline">Edit Profile</span>
                                    </button>
                                )}
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            <span>Save</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                        >
                                            <X className="h-4 w-4" />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6 md:px-8 md:py-8 space-y-8">
                        {/* Core details – slate tint (Read-only) */}
                        <section className="rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/50 p-4 md:p-5">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">Registration &amp; type</h3>
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
                                    {!isEditing ? (
                                        <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">
                                            {(institution.delivery_modes || []).map((m) => modeLabels[m] || m).join(", ") || "—"}
                                        </p>
                                    ) : (
                                        <div className="mt-2 space-y-2">
                                            {(["FACE_TO_FACE", "BLENDED", "MOBILE"] as DeliveryMode[]).map((mode) => (
                                                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        value={mode}
                                                        {...register("delivery_modes")}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{modeLabels[mode]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Province</p>
                                    <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{institution.province}</p>
                                </div>
                            </div>
                        </section>

                        {/* Contact Information – blue/indigo tint */}
                        <section className="rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/80 dark:border-indigo-800/50 p-4 md:p-5">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Contact Information
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-indigo-800/80 dark:text-indigo-300/80 flex items-center gap-2">
                                        Contact person
                                    </label>
                                    {!isEditing ? (
                                        <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{institution.contact_person_name || "—"}</p>
                                    ) : (
                                        <input
                                            type="text"
                                            {...register("contact_person_name")}
                                            className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-indigo-800/80 dark:text-indigo-300/80 flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Contact email
                                    </label>
                                    {!isEditing ? (
                                        <p className="mt-1 text-base">
                                            {institution.contact_email ? (
                                                <a href={`mailto:${institution.contact_email}`} className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded">
                                                    {institution.contact_email}
                                                </a>
                                            ) : (
                                                <span className="text-slate-500">—</span>
                                            )}
                                        </p>
                                    ) : (
                                        <div>
                                            <input
                                                type="email"
                                                {...register("contact_email", {
                                                    pattern: {
                                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                        message: "Invalid email format",
                                                    },
                                                })}
                                                className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                            {errors.contact_email && (
                                                <p className="mt-1 text-sm text-rose-600">{errors.contact_email.message}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-indigo-800/80 dark:text-indigo-300/80 flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Contact number
                                    </label>
                                    {!isEditing ? (
                                        <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{institution.contact_number || "—"}</p>
                                    ) : (
                                        <input
                                            type="tel"
                                            {...register("contact_number")}
                                            className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Address – emerald tint */}
                        <section className="rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100/80 dark:border-emerald-800/50 p-4 md:p-5">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-4 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-emerald-500" /> Address
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-emerald-700/80 dark:text-emerald-300/80">Physical address</label>
                                    {!isEditing ? (
                                        <p className="mt-1 text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{institution.physical_address || "—"}</p>
                                    ) : (
                                        <textarea
                                            {...register("physical_address", { required: "Physical address is required" })}
                                            rows={3}
                                            className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                        />
                                    )}
                                    {errors.physical_address && (
                                        <p className="mt-1 text-sm text-rose-600">{errors.physical_address.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-emerald-700/80 dark:text-emerald-300/80">Postal address</label>
                                    {!isEditing ? (
                                        <p className="mt-1 text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{institution.postal_address || "—"}</p>
                                    ) : (
                                        <textarea
                                            {...register("postal_address")}
                                            rows={3}
                                            className="mt-1 block w-full rounded-lg border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Footer meta */}
                        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                                Created {formatDate(institution.created_at)}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                                Updated {formatDate(institution.updated_at)}
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
