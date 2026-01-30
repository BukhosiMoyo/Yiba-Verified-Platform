"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Archive, Trash2, AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select } from "@/components/ui/select";
import { SanitizedHtml } from "@/components/shared/SanitizedHtml";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "ACTIVE" | "ARCHIVED";
  created_by: {
    name: string;
    role?: string;
    email: string;
  };
  target_roles?: string[];
  institution_id?: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at?: string;
}

const priorityConfig = {
  LOW: { label: "Low", icon: Info, className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  MEDIUM: { label: "Medium", icon: Bell, className: "bg-muted text-muted-foreground" },
  HIGH: { label: "High", icon: AlertTriangle, className: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" },
  URGENT: { label: "Urgent", icon: AlertCircle, className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
};

// Institution admins can only target their own institution's students and staff
const INSTITUTION_TARGET_ROLES = [
  { value: "STUDENT", label: "Students" },
  { value: "INSTITUTION_STAFF", label: "Institution Staff" },
];

export default function InstitutionAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [expiresAt, setExpiresAt] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/institution/announcements", {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.items || []);
      } else {
        toast.error("Failed to load announcements");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setMessage("");
    setPriority("MEDIUM");
    setExpiresAt("");
    setTargetRoles([]);
    setError("");
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setPriority(announcement.priority);
    setExpiresAt(announcement.expires_at ? announcement.expires_at.split("T")[0] : "");
    setTargetRoles(announcement.target_roles || []);
    setError("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const textOnly = (message || "").replace(/<[^>]+>/g, "").trim();
    if (!textOnly) {
      setError("Please enter a message.");
      return;
    }
    setIsSubmitting(true);

    try {
      const payload: any = {
        title,
        message,
        priority,
      };

      if (expiresAt) {
        payload.expires_at = new Date(expiresAt).toISOString();
      }

      payload.target_roles = targetRoles;

      let response;
      if (editingAnnouncement) {
        response = await fetch(`/api/announcements/${editingAnnouncement.announcement_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      } else {
        response = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }

      if (response.ok) {
        toast.success(editingAnnouncement ? "Announcement updated" : "Announcement created");
        setIsDialogOpen(false);
        fetchAnnouncements();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || data.message || "Failed to save announcement");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (announcement: Announcement) => {
    if (!confirm(`Archive "${announcement.title}"?`)) return;

    try {
      const response = await fetch(`/api/announcements/${announcement.announcement_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: announcement.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Announcement updated");
        fetchAnnouncements();
      } else {
        toast.error("Failed to update announcement");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`Delete "${announcement.title}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/announcements/${announcement.announcement_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Announcement deleted");
        fetchAnnouncements();
      } else {
        toast.error("Failed to delete announcement");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">
            Send announcements to your institution's students and staff
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          <EmptyState
            icon={<Bell className="h-10 w-10 text-muted-foreground" />}
            title="No announcements yet"
            description="Create your first announcement to communicate with your institution's students and staff."
          />
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => {
            const config = priorityConfig[announcement.priority];
            const Icon = config.icon;
            return (
              <Card key={announcement.announcement_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                        <Badge className={config.className}>{config.label}</Badge>
                        {announcement.status === "ARCHIVED" && (
                          <Badge variant="outline">Archived</Badge>
                        )}
                      </div>
                      <SanitizedHtml
                        html={announcement.message}
                        className="text-sm text-gray-600 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4"
                      />
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>
                          Created by {announcement.created_by.role || announcement.created_by.name}
                          {announcement.created_by.role && announcement.created_by.name && (
                            <span className="text-gray-400"> ({announcement.created_by.name})</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        {announcement.target_roles && announcement.target_roles.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              Target: {announcement.target_roles.join(", ")}
                            </span>
                          </>
                        )}
                        {(!announcement.target_roles || announcement.target_roles.length === 0) && (
                          <>
                            <span>•</span>
                            <span className="text-gray-400">Visible to all institution users</span>
                          </>
                        )}
                        {announcement.expires_at && (
                          <>
                            <span>•</span>
                            <span>
                              Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(announcement)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(announcement)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement
                ? "Update the announcement details below."
                : "Create a new announcement for your institution's students and staff."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <RichTextEditor
                  key={editingAnnouncement?.announcement_id ?? "new"}
                  value={message}
                  onChange={setMessage}
                  placeholder="Announcement message – you can use bold, lists, links, and images."
                  disabled={isSubmitting}
                  minHeight="200px"
                  className="[&_.ProseMirror]:min-h-[200px]"
                />
                <p className="text-xs text-gray-500">
                  Use the toolbar for formatting, links, and inserting images by URL.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  disabled={isSubmitting}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At (Optional)</Label>
                <Input
                  type="date"
                  id="expires_at"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  Leave empty for announcements that don't expire
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_roles">Target Audience (Optional)</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Select which user types can see this announcement. Leave all unchecked to show to all institution users.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INSTITUTION_TARGET_ROLES.map((role) => (
                    <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetRoles.includes(role.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTargetRoles([...targetRoles, role.value]);
                          } else {
                            setTargetRoles(targetRoles.filter((r) => r !== role.value));
                          }
                        }}
                        disabled={isSubmitting}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{role.label}</span>
                    </label>
                  ))}
                </div>
                {targetRoles.length === 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    All institution users will see this announcement
                  </p>
                )}
              </div>
              {error && (
                <Alert variant="error" description={error} />
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAnnouncement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
