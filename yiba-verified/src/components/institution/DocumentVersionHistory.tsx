"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Version {
  document_id: string;
  version: number;
  file_name: string;
  status: string;
  uploaded_at: string;
  uploaded_by: string;
  uploadedBy: {
    user_id: string;
    email: string;
    name: string;
  };
  isCurrentVersion: boolean;
}

interface DocumentVersionHistoryProps {
  currentDocumentId: string;
  versions: Version[];
}

/**
 * DocumentVersionHistory Component
 * 
 * Displays version history for a document with expandable drawer functionality.
 */
export function DocumentVersionHistory({ currentDocumentId, versions }: DocumentVersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPLOADED":
        return <Badge variant="default">Uploaded</Badge>;
      case "FLAGGED":
        return <Badge variant="destructive">Flagged</Badge>;
      case "ACCEPTED":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Accepted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Version History</CardTitle>
            <CardDescription>
              {versions.length} version{versions.length !== 1 ? "s" : ""} available
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "Hide" : "Show"} History
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.document_id}
                className={`p-4 border rounded-lg ${
                  version.isCurrentVersion ? "bg-primary/5 border-primary" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={version.isCurrentVersion ? "default" : "outline"}>
                        v{version.version}
                      </Badge>
                      {version.isCurrentVersion && (
                        <Badge variant="secondary">Current Version</Badge>
                      )}
                      {getStatusBadge(version.status)}
                    </div>
                    <p className="font-medium">{version.file_name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Uploaded by {version.uploadedBy.name}</span>
                      <span>•</span>
                      <span>{new Date(version.uploaded_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {!version.isCurrentVersion && (
                    <Link href={`/institution/documents/${version.document_id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
