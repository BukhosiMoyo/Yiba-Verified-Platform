
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
    profileId: string;
    initialLiked: boolean;
    initialCount: number;
    isLoggedIn: boolean;
}

export function LikeButton({ profileId, initialLiked, initialCount, isLoggedIn }: LikeButtonProps) {
    const router = useRouter();
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [loading, setLoading] = useState(false);

    async function handleToggle() {
        if (!isLoggedIn) {
            toast.error("Please sign in to like profiles", {
                action: {
                    label: "Sign In",
                    onClick: () => router.push(`/login?callbackUrl=${window.location.pathname}`)
                }
            });
            return;
        }

        const prevLiked = liked;
        const prevCount = count;

        // Optimistic UI
        setLiked(!liked);
        setCount(liked ? count - 1 : count + 1);
        setLoading(true);

        try {
            const res = await fetch("/api/talent/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileId })
            });

            if (!res.ok) {
                throw new Error("Failed");
            }

            const data = await res.json(); // returns { liked: boolean }
            // Sync with server if needed
            router.refresh();

        } catch (error) {
            // Revert
            setLiked(prevLiked);
            setCount(prevCount);
            toast.error("Failed to update like");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            variant="outline"
            size="lg"
            className={cn("gap-2 min-w-[100px]", liked && "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700")}
            onClick={handleToggle}
            disabled={loading}
        >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            <span>{count}</span>
        </Button>
    );
}
