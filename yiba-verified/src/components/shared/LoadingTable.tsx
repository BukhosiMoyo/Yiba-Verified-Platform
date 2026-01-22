import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface LoadingTableProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
}

/**
 * LoadingTable Component
 * 
 * Premium skeleton loading state for tables with consistent row height and smooth animations.
 * 
 * @example
 * ```tsx
 * <LoadingTable columns={5} rows={8} showHeader />
 * ```
 */
export function LoadingTable({ columns = 5, rows = 5, showHeader = true }: LoadingTableProps) {
  return (
    <Table>
      {showHeader && (
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-3.5 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: columns }).map((_, j) => (
              <TableCell key={j}>
                {/* Vary skeleton widths for more realistic look */}
                <Skeleton
                  className={cn(
                    "h-4 rounded-md",
                    j === 0 && "w-32", // First column (usually name) - wider
                    j === columns - 1 && "w-16", // Last column (usually actions) - narrower
                    j > 0 && j < columns - 1 && "w-24" // Middle columns - medium
                  )}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
