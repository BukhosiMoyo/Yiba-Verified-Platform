import { cn } from "@/lib/utils";

/**
 * Skeleton Component
 * 
 * Premium skeleton loader with subtle shimmer effect.
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-24" />
 * <Skeleton className="h-10 w-full" />
 * ```
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200/60",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
