"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  exportUrl: string;
  filename?: string;
  className?: string;
  format?: "csv" | "json";
  /** Optional label, e.g. "Submissions" → "Export Submissions (CSV)" */
  label?: string;
}

/**
 * ExportButton Component
 * 
 * Reusable button component for exporting data to CSV or JSON.
 * If format is specified, shows a single button. Otherwise, shows two buttons.
 */
export function ExportButton({ exportUrl, filename, className, format, label }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (exportFormat: "csv" | "json") => {
    setIsExporting(true);
    try {
      const url = new URL(exportUrl, window.location.origin);
      url.searchParams.set("format", exportFormat);

      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include", // Include cookies for auth
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use provided/default
      const contentDisposition = response.headers.get("Content-Disposition");
      let downloadFilename = filename || `export-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          downloadFilename = filenameMatch[1];
        }
      }

      // Get blob and create download link
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Export error:", error);
      alert(`Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // If format is specified, show single button
  if (format) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        className={className}
        onClick={() => handleExport(format)}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isExporting ? "Exporting..." : label ? `Export ${label} (${format.toUpperCase()})` : `Export ${format.toUpperCase()}`}
      </Button>
    );
  }

  // Otherwise, show both buttons
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        className={className}
        onClick={() => handleExport("csv")}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isExporting ? "Exporting..." : "Export CSV"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        className={className}
        onClick={() => handleExport("json")}
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isExporting ? "Exporting..." : "Export JSON"}
      </Button>
    </div>
  );
}
