import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthSocialButtonProps {
  provider: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AuthSocialButton({
  provider,
  icon,
  onClick,
  disabled,
  className,
}: AuthSocialButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full h-10 justify-center gap-2 font-medium",
        "hover:bg-gray-50",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>Continue with {provider}</span>
    </Button>
  );
}
