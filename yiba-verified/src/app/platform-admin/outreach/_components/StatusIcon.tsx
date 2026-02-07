import {
    XCircle,
    Ban,
    Archive,
    AlertTriangle,
    CheckCircle,
    MailWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusIconProps {
    status: {
        bounced: boolean;
        opt_out: boolean;
        declined: boolean;
        ai_suppressed: boolean;
    };
    className?: string;
}

export function StatusIcon({ status, className }: StatusIconProps) {
    if (status.bounced) {
        return (
            <div title="Bounced" className={cn("text-red-500", className)}>
                <MailWarning className="h-4 w-4" />
            </div>
        );
    }
    if (status.opt_out) {
        return (
            <div title="Opted Out" className={cn("text-gray-500", className)}>
                <Ban className="h-4 w-4" />
            </div>
        );
    }
    if (status.declined) {
        return (
            <div title="Declined" className={cn("text-orange-500", className)}>
                <XCircle className="h-4 w-4" />
            </div>
        );
    }
    if (status.ai_suppressed) {
        return (
            <div title="AI Suppressed" className={cn("text-yellow-500", className)}>
                <AlertTriangle className="h-4 w-4" />
            </div>
        );
    }
    return null;
}
