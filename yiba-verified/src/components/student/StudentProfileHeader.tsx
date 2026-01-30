"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, ChevronDown, Download, Share2, Pencil, FilePlus, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// System-populated (read-only). TODO: from GET /api/me or learner/institution.
export type StudentProfileHeaderSystem = {
  name: string;
  verifiedStatus: string;
  verifiedDate: string;
  verifiedBy: string;
  institutions: { name: string; studentId?: string }[];
  downloadCvOptions?: { id: string; label: string }[];
  shareOptions?: { id: string; label: string }[];
};

export type StudentProfileHeaderProps = {
  /** Editable: photo (avatar). Demo: object URL in state. */
  photoUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
  system: StudentProfileHeaderSystem;
  /** Called when a Download CV option is chosen. Passes option.id (e.g. "primary", "pm"). */
  onDownloadCv?: (optionId: string) => void;
  /** Called when Share "Public link" is chosen. */
  onSharePublicLink?: () => void;
  /** Called when Share "Private link" is chosen. */
  onSharePrivateLink?: () => void;
  /** When set, show "View live profile" button that opens this URL in a new tab. */
  viewLiveProfileHref?: string | null;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const defaultSystem: StudentProfileHeaderSystem = {
  name: "Kagiso Botha",
  verifiedStatus: "Verified",
  verifiedDate: "19 Jan 2026",
  verifiedBy: "Demo College",
  institutions: [{ name: "Demo College", studentId: "STU-10482" }],
  downloadCvOptions: [
    { id: "primary", label: "Primary CV" },
    { id: "pm", label: "Project Management CV" },
    { id: "support", label: "Support CV" },
  ],
  shareOptions: [
    { id: "public", label: "Public link" },
    { id: "private", label: "Private link" },
  ],
};

export function StudentProfileHeader({
  photoUrl = null,
  onPhotoChange,
  system = defaultSystem,
  onDownloadCv,
  onSharePublicLink,
  onSharePrivateLink,
  viewLiveProfileHref = null,
}: StudentProfileHeaderProps) {
  const init = getInitials(system.name);
  const [copied, setCopied] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(selectedFile);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [selectedFile]);

  const institution = system.institutions[0];
  const studentId = institution?.studentId ?? "—";

  const copyStudentId = () => {
    void navigator.clipboard.writeText(studentId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const openPhotoModal = () => {
    setSelectedFile(null);
    setPhotoModalOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) setSelectedFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const chooseFile = () => fileInputRef.current?.click();

  const savePhoto = () => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      onPhotoChange?.(url);
      toast.success("Photo updated (demo)");
      setPhotoModalOpen(false);
      setSelectedFile(null);
    }
  };

  return (
    <header className="rounded-xl border border-border bg-card p-4 md:p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* Left: Avatar, name, badges, chips */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold overflow-hidden",
                "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm",
                "dark:from-blue-600 dark:to-blue-700"
              )}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{init}</span>
              )}
            </div>
            <button
              type="button"
              onClick={openPhotoModal}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              Update photo
            </button>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{system.name}</h1>
              <Badge variant="success" className="shrink-0 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50">
                {system.verifiedStatus}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground dark:text-gray-400">
              Last verified: {system.verifiedDate}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ChipWithCopy
                label={`Student ID: ${studentId}`}
                value={studentId}
                copied={copied}
                onCopy={copyStudentId}
              />
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Institution: {institution?.name ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {viewLiveProfileHref && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={viewLiveProfileHref} target="_blank" rel="noopener noreferrer" aria-label="View live profile in new tab">
                <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                View live profile
              </a>
            </Button>
          )}
          <Button size="sm" className="gap-1.5">
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
            Edit Profile
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" strokeWidth={1.5} />
                Download CV
                <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              {(system.downloadCvOptions ?? defaultSystem.downloadCvOptions)?.map((o) => (
                <DropdownMenuItem key={o.id} onSelect={() => onDownloadCv?.(o.id)}>
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
                Share Profile
                <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {(system.shareOptions ?? defaultSystem.shareOptions)?.map((o) => (
                <DropdownMenuItem
                  key={o.id}
                  onSelect={() => (o.id === "public" ? onSharePublicLink?.() : onSharePrivateLink?.())}
                >
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FilePlus className="h-4 w-4" strokeWidth={1.5} />
            Create CV Version
          </Button>
        </div>
      </div>

      {/* Update photo modal (demo: no storage) */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={!selectedFile ? chooseFile : undefined}
              className={cn(
                "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                "border-gray-200/80 bg-gray-50/30 dark:border-gray-600/60 dark:bg-gray-800/30",
                !selectedFile && "cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 dark:hover:border-gray-500 dark:hover:bg-gray-800/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile && previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={previewUrl}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-full">{selectedFile.name}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Drag and drop your photo here</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">or</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); chooseFile(); }}>
                    Choose file
                  </Button>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePhoto} disabled={!selectedFile}>
              Save photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function ChipWithCopy({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-gray-200/80 bg-gray-50/80 pl-2.5 pr-1 py-1",
        "text-xs font-medium text-gray-700 dark:border-gray-600/60 dark:bg-gray-800/60 dark:text-gray-300"
      )}
    >
      {label}
      <button
        type="button"
        onClick={onCopy}
        className="rounded p-0.5 hover:bg-gray-200/80 dark:hover:bg-gray-600/60 transition-colors"
        aria-label={copied ? "Copied" : `Copy ${value}`}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" strokeWidth={2} />
        ) : (
          <Copy className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
        )}
      </button>
    </span>
  );
}
