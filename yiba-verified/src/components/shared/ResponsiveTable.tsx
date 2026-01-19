"use client";

import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * ResponsiveTable Component
 * 
 * Wraps a table with border, rounded corners, and horizontal scrolling.
 * Provides clean table container styling.
 * 
 * @param withCard - If true, adds background and shadow. Default: false (border only).
 */
export function ResponsiveTable({ 
  children, 
  className,
  withCard = false
}: { 
  children: ReactNode;
  className?: string;
  withCard?: boolean;
}) {
  return (
    <div className={cn(
      "w-full rounded-xl border border-gray-200/60 overflow-hidden",
      withCard ? "bg-white shadow-sm" : "bg-white",
      className
    )}>
      <div className="w-full overflow-x-auto overflow-y-hidden">
        {children}
      </div>
    </div>
  );
}

/**
 * ResponsiveTableCard Component
 * 
 * Alternative to tables on mobile - displays data as cards.
 * Use this for better mobile UX when table data can be represented as cards.
 */
export function ResponsiveTableCard<T extends { id: string }>({
  items,
  columns,
  mobileCardRenderer,
}: {
  items: T[];
  columns: Array<{
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
    className?: string;
  }>;
  mobileCardRenderer?: (item: T) => ReactNode;
}) {
  return (
    <>
      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden space-y-4">
        {items.map((item) =>
          mobileCardRenderer ? (
            mobileCardRenderer(item)
          ) : (
            <div key={item.id} className="border rounded-lg p-4 space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between">
                  <span className="font-medium text-muted-foreground">{col.header}:</span>
                  <span className="text-right">
                    {col.render ? col.render(item) : String((item as any)[col.key] || "N/A")}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
