import { InviteReviewWizard } from "./_components/InviteReviewWizard";
import { ParticleBackground } from "./_components/ParticleBackground";

interface PageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function InviteReviewPage(props: PageProps) {
    const params = await props.params;

    return (
        <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
            <ParticleBackground />
            <div className="relative z-10 w-full px-4 py-8 md:py-12 flex items-center justify-center">
                <InviteReviewWizard token={params.token} />
            </div>
        </main>
    );
}
