"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoBackButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function GoBackButton({ variant = "ghost", className }: GoBackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      className={cn("w-full h-10", className)}
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={1.5} aria-hidden />
      Go Back
    </Button>
  );
}
