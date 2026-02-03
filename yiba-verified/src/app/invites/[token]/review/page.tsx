import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import ReviewWalkthroughClient from "./ReviewWalkthroughClient";

export default async function ReviewPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const resolvedParams = await params;

    return (
        <Suspense
            fallback={
                <AuthLayout>
                    <AuthCard title="Loading..." subtitle="Please wait">
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    </AuthCard>
                </AuthLayout>
            }
        >
            <ReviewWalkthroughClient token={resolvedParams.token} />
        </Suspense>
    );
}
