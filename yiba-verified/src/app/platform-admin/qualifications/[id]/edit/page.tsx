import { QualificationForm } from "@/components/platform-admin/qualifications/QualificationForm";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EditQualificationPageProps {
    params: {
        id: string;
    };
}

export default async function EditQualificationPage({ params }: EditQualificationPageProps) {
    const qualification = await prisma.qualification.findUnique({
        where: { qualification_id: params.id },
    });

    if (!qualification) {
        notFound();
    }

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/platform-admin/qualifications" className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Qualification</h1>
                    <p className="text-muted-foreground">Update qualification details.</p>
                </div>
            </div>

            <QualificationForm initialData={qualification} isEditing />
        </div>
    );
}
