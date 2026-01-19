import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-50 text-blue-700 hover:bg-blue-100",
        secondary:
          "border-gray-200/60 bg-gray-50 text-gray-700 hover:bg-gray-100",
        destructive:
          "border-transparent bg-red-50 text-red-700 hover:bg-red-100",
        success:
          "border-transparent bg-green-50 text-green-700 hover:bg-green-100",
        warning:
          "border-transparent bg-amber-50 text-amber-700 hover:bg-amber-100",
        outline: 
          "border-gray-200/60 bg-transparent text-gray-700 hover:bg-gray-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
