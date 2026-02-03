import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StepContentProps {
    icon: React.ElementType; // Icon component
    title: string;
    children: ReactNode;
    isActive: boolean;
    className?: string;
    emoji?: ReactNode; // Optional animated emoji/icon component to replace static icon if provided
}

export function StepContent({
    icon: Icon,
    title,
    children,
    className,
    emoji,
}: StepContentProps) {
    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Icon / Emoji Area */}
            <div className="flex-shrink-0 mb-6 flex justify-center">
                {emoji ? (
                    <div className="h-16 w-16 md:h-20 md:w-20 flex items-center justify-center text-4xl md:text-5xl">
                        {emoji}
                    </div>
                ) : (
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 text-center px-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
                    {title}
                </h2>

                <div className="text-muted-foreground text-sm md:text-base leading-relaxed space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
