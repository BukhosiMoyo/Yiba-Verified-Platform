'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Sandbox Error:', error);
    }, [error]);

    return (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <h2 className="text-lg font-semibold">Something went wrong!</h2>
            </div>
            <p className="text-muted-foreground max-w-md text-center">
                {error.message || "An unexpected error occurred while loading the sandbox."}
            </p>
            <Button onClick={() => reset()} variant="outline">
                Try again
            </Button>
        </div>
    );
}
