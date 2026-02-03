import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Review Invitation - Yiba Verified",
    description: "Review and manage your institution invitation.",
};

export default function InviteReviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full bg-background font-sans text-foreground selection:bg-primary/20">
            {children}
        </div>
    );
}
