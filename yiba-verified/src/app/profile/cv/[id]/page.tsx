
import { CVEditor } from "../_components/CVEditor";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

interface PageProps {
    params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    return { title: "Edit CV | Yiba Verified" };
}

export default async function EditCVPage({ params }: PageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const cv = await prisma.cvVersion.findUnique({
        where: { id: params.id }
    });

    if (!cv || cv.user_id !== session.user.userId) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <CVEditor initialData={cv} />
        </div>
    );
}
