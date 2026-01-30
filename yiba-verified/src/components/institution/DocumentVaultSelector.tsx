"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface Document {
  document_id: string;
  file_name: string;
  document_type?: string;
  mime_type?: string;
  file_size_bytes?: number;
  uploaded_at: Date;
}

interface DocumentVaultSelectorProps {
  institutionId: string;
  readinessId?: string; // Optional: if provided, will automatically link document
  onSelect: (documentId: string) => void;
  selectedDocumentIds?: string[];
  label?: string;
}

/**
 * Document Vault Selector Component
 * 
 * Allows institutions to select existing documents from their vault
 * to link to readiness record sections.
 */
export function DocumentVaultSelector({
  institutionId,
  readinessId,
  onSelect,
  selectedDocumentIds = [],
  label = "Select from Document Vault",
}: DocumentVaultSelectorProps) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open, institutionId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Use suggestions API if section info is available, otherwise use vault API
      const url = readinessId
        ? `/api/institutions/documents/suggestions?institutionId=${institutionId}&readinessId=${readinessId}`
        : `/api/institutions/documents/vault?institutionId=${institutionId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      // Suggestions API returns { suggestions: [...] }, vault API returns { items: [...] }
      setDocuments(data.suggestions || data.items || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSelect = async (documentId: string) => {
    try {
      // If readinessId is provided, link document to readiness record
      if (readinessId) {
        const response = await fetch(`/api/institutions/readiness/${readinessId}/documents/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_id: documentId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to link document");
        }
        toast.success("Document linked successfully");
        setOpen(false);
      } else {
        toast.success("Document selected");
      }
      
      onSelect(documentId);
    } catch (error: any) {
      toast.error(error.message || "Failed to link document");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Document from Vault</DialogTitle>
          <DialogDescription>
            Choose an existing document from your institution's document vault to link to this readiness record.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {searchQuery ? "No documents match your search" : "No documents in vault"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => {
                  const isSelected = selectedDocumentIds.includes(doc.document_id);
                  return (
                    <div
                      key={doc.document_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.document_type || doc.mime_type || "Document"} • {formatFileSize(doc.file_size_bytes)} •{" "}
                            {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <Button type="button" variant="outline" size="sm" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Selected
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => handleSelect(doc.document_id)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
