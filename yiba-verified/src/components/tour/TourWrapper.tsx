"use client";

import { useSession } from "next-auth/react";
import { TourProvider } from "./TourProvider";

export function TourWrapper({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const role = session?.user?.role as string | undefined;

    return (
        <TourProvider userRole={role}>
            {children}
        </TourProvider>
    );
}
