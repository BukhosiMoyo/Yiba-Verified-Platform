"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ANNOUNCEMENT_TARGET_ROLES } from "@/lib/announcements";

interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "ACTIVE" | "ARCHIVED";
  created_by: {
    name: string;
    role?: string; // e.g., "Platform Admin", "QCTO User"
    email: string;
  };
  target_roles?: string[]; // Which roles can see this (empty = all users)
  institution_id?: string | null; // Institution-scoped or null for platform-wide
  expires_at: string | null;
  created_at: string;
  updated_at?: string;
}

const priorityConfig = {
  LOW: { label: "Low", icon: Info, className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  MEDIUM: { label: "Medium", icon: Bell, className: "bg-muted text-muted-foreground" },
  HIGH: { label: "High", icon: AlertTriangle, className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  URGENT: { label: "Urgent", icon: AlertCircle, className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [expiresAt, setExpiresAt] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([]); // Empty = all users

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      // Fetch all announcements (including archived) - we'll need to create this endpoint
      // For now, using the public endpoint and we'll add admin endpoint later
      const response = await fetch("/api/platform-admin/announcements");
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.items || []);
      } else if (response.status === 404) {
        // Endpoint doesn't exist yet, use public endpoint as fallback
        const publicResponse = await fetch("/api/announcements");
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          setAnnouncements(publicData.items || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setTitle("");
    setMessage("");
    setPriority("MEDIUM");
    setExpiresAt("");
    setTargetRoles([]); // Empty = all users
    setError("");
    setIsDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setPriority(announcement.priority);
    setExpiresAt(announcement.expires_at ? announcement.expires_at.split("T")[0] : "");
    setTargetRoles(announcement.target_roles || []); // Empty = all users
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

      // Include target_roles (empty array = visible to all users)
      payload.target_roles = targetRoles;

      let response;
      if (editingAnnouncement) {
        // Update existing
        response = await fetch(`/api/announcements/${editingAnnouncement.announcement_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      } else {
        // Create new
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

  const handleArchive = async (announcementId: string) => {
    if (!confirm("Are you sure you want to archive this announcement?")) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Announcement archived");
        fetchAnnouncements();
      } else {
        toast.error("Failed to archive announcement");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!confirm("Are you sure you want to delete this announcement? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/announcements/${announcementId}`, {
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

  const activeAnnouncements = announcements.filter((a) => a.status === "ACTIVE");
  const archivedAnnouncements = announcements.filter((a) => a.status === "ARCHIVED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage system-wide announcements visible to all users
          </p>
        </div>
        <Button onClick={handleCreate} className="h-10">
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Active Announcements */}
          <Card>
            <CardHeader>
              <CardTitle>Active Announcements</CardTitle>
              <CardDescription>
                Currently visible to all users ({activeAnnouncements.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAnnouncements.length === 0 ? (
                <EmptyState
                  title="No active announcements"
                  description="Create an announcement to notify all users"
                />
              ) : (
                <div className="space-y-4">
                  {activeAnnouncements.map((announcement) => {
                    const config = priorityConfig[announcement.priority];
                    const Icon = config.icon;
                    return (
                      <div
                        key={announcement.announcement_id}
                        className="border border-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                                <Badge className={config.className}>{config.label}</Badge>
                              </div>
                              <SanitizedHtml
                                html={announcement.message}
                                className="text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4"
                              />
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  Created by {announcement.created_by.role || announcement.created_by.name}
                                  {announcement.created_by.role && announcement.created_by.name && (
                                    <span className="opacity-70"> ({announcement.created_by.name})</span>
                                  )}
                                </span>
                                <span>•</span>
                                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                {announcement.target_roles && announcement.target_roles.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                      Target: {announcement.target_roles.join(", ")}
                                    </span>
                                  </>
                                )}
                                {(!announcement.target_roles || announcement.target_roles.length === 0) && (
                                  <>
                                    <span>•</span>
                                    <span className="opacity-70">Visible to all users</span>
                                  </>
                                )}
                                {announcement.institution_id && (
                                  <>
                                    <span>•</span>
                                    <span className="text-purple-600 dark:text-purple-400">Institution-scoped</span>
                                  </>
                                )}
                                {!announcement.institution_id && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600 dark:text-blue-400">Platform-wide</span>
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
                          </div>
                          <div className="flex items-center gap-2">
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
                              onClick={() => handleArchive(announcement.announcement_id)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(announcement.announcement_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Archived Announcements */}
          {archivedAnnouncements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Archived Announcements</CardTitle>
                <CardDescription>
                  No longer visible to users ({archivedAnnouncements.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {archivedAnnouncements.map((announcement) => {
                    const config = priorityConfig[announcement.priority];
                    const Icon = config.icon;
                    return (
                      <div
                        key={announcement.announcement_id}
                        className="border border-border rounded-lg p-4 space-y-3 opacity-60"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                                <Badge variant="outline">Archived</Badge>
                              </div>
                              <SanitizedHtml
                                html={announcement.message}
                                className="text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(announcement.announcement_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[680px] bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription>
              Announcements will be visible to all users. Use priority to control visibility.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
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
                <p className="text-xs text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">
                  Leave empty for announcements that don't expire
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_roles">Target Audience (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select which user types can see this announcement. Leave all unchecked to show to everyone.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ANNOUNCEMENT_TARGET_ROLES.map((role) => (
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
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground">{role.label}</span>
                    </label>
                  ))}
                </div>
                {targetRoles.length === 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    All users will see this announcement
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
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingAnnouncement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
