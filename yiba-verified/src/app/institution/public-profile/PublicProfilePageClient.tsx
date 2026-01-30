"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, ExternalLink, Megaphone, Users, CheckCircle2, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

type Profile = {
  id: string;
  institution_id: string;
  slug: string;
  is_public: boolean;
  tagline: string | null;
  about: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_visibility: string | null;
  apply_mode: string | null;
  apply_url: string | null;
  featured_until: Date | null;
  featured_priority: number;
  created_at: string;
  updated_at: string;
};

type Post = {
  id: string;
  type: string;
  title: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  is_verified: boolean;
  created_at: string;
};

type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  highest_education_level: string | null;
  qualification_interest: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const CONTACT_VISIBILITY_OPTIONS = [
  { value: "HIDDEN", label: "Hidden" },
  { value: "REVEAL_ON_CLICK", label: "Reveal on click" },
  { value: "PUBLIC", label: "Public" },
];

const APPLY_MODE_OPTIONS = [
  { value: "INTERNAL", label: "Internal (enquiry form only)" },
  { value: "EXTERNAL", label: "External (link to your site only)" },
  { value: "BOTH", label: "Both" },
];

const POST_TYPE_OPTIONS = [
  { value: "ACHIEVEMENT", label: "Achievement" },
  { value: "UPDATE", label: "Update" },
];

const LEAD_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "CLOSED", label: "Closed" },
];

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

export function PublicProfilePageClient({
  canManageProfile,
  canViewLeads,
}: {
  canManageProfile: boolean;
  canViewLeads: boolean;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(canManageProfile);
  const [loadingLeads, setLoadingLeads] = useState(canViewLeads);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [benefitsDismissed, setBenefitsDismissed] = useState(false);
  const [benefitsModalOpen, setBenefitsModalOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [leadViewId, setLeadViewId] = useState<string | null>(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const leadSearchRef = useRef("");
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadDetail, setLeadDetail] = useState<Lead | null>(null);
  const [updatingLeadStatus, setUpdatingLeadStatus] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/institution/public-profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (!canManageProfile) return;
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/institution/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.items ?? []);
      }
    } finally {
      setLoadingPosts(false);
    }
  }, [canManageProfile]);

  const fetchLeads = useCallback(
    async (page = 1, searchOverride?: string) => {
      if (!canViewLeads) return;
      setLoadingLeads(true);
      try {
        const params = new URLSearchParams();
        if (leadStatusFilter) params.set("status", leadStatusFilter);
        const search = (searchOverride !== undefined ? searchOverride : leadSearchRef.current)?.trim() ?? "";
        if (search) params.set("search", search);
        params.set("page", String(page));
        params.set("limit", "20");
        const res = await fetch(`/api/institution/leads?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.items ?? []);
          setLeadsTotal(data.total ?? 0);
          setLeadsPage(data.page ?? 1);
        }
      } finally {
        setLoadingLeads(false);
      }
    },
    [canViewLeads, leadStatusFilter]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (canViewLeads) fetchLeads(1);
  }, [canViewLeads, fetchLeads]);

  const handleTogglePublic = async (checked: boolean) => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/institution/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: checked }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to update");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const applyMode = (fd.get("apply_mode") as string) || profile.apply_mode;
    const applyUrl = (fd.get("apply_url") as string)?.trim() || null;
    if (
      (applyMode === "EXTERNAL" || applyMode === "BOTH") &&
      (!applyUrl || !applyUrl.length)
    ) {
      alert("Apply URL is required when apply mode is External or Both.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/institution/public-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: (fd.get("tagline") as string)?.trim() || null,
          about: (fd.get("about") as string)?.trim() || null,
          contact_visibility: (fd.get("contact_visibility") as string) || undefined,
          apply_mode: applyMode || undefined,
          apply_url: applyUrl,
          contact_email: (fd.get("contact_email") as string)?.trim() || null,
          contact_phone: (fd.get("contact_phone") as string)?.trim() || null,
          logo_url: (fd.get("logo_url") as string)?.trim() || null,
          banner_url: (fd.get("banner_url") as string)?.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to update profile");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = (fd.get("title") as string)?.trim();
    const body = (fd.get("body") as string)?.trim();
    if (!title || !body) {
      alert("Title and body are required.");
      return;
    }
    setSavingPost(true);
    try {
      const res = await fetch("/api/institution/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fd.get("type") || "UPDATE",
          title,
          body,
          image_url: (fd.get("image_url") as string)?.trim() || null,
          video_url: (fd.get("video_url") as string)?.trim() || null,
        }),
      });
      if (res.ok) {
        setCreatePostOpen(false);
        form.reset();
        fetchPosts();
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to create post");
      }
    } finally {
      setSavingPost(false);
    }
  };

  const openLeadDetail = async (id: string) => {
    setLeadViewId(id);
    try {
      const res = await fetch(`/api/institution/leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLeadDetail(data);
      }
    } catch {
      setLeadDetail(null);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    setUpdatingLeadStatus(true);
    try {
      const res = await fetch(`/api/institution/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setLeadDetail((prev) => (prev?.id === leadId ? { ...prev, status } : prev));
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status } : l))
        );
      }
    } finally {
      setUpdatingLeadStatus(false);
    }
  };

  if (!canManageProfile && !canViewLeads) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">You don’t have access to Public Profile or Leads.</p>
      </div>
    );
  }

  if (loadingProfile && !profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!profile && !loadingProfile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Could not load public profile.</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "";
  const publicUrl = profile.is_public ? `${baseUrl}/institutions/${profile.slug}` : null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Public Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage how your institution appears on the public directory and capture leads.
        </p>
      </div>

      {canManageProfile && (
        <>
          {/* Benefits banner / modal when profile is disabled */}
          {!profile.is_public && !benefitsDismissed && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Get more students with a Public Profile
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBenefitsDismissed(true)}
                  aria-label="Dismiss"
                >
                  Dismiss
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  List your institution on Yiba Verified so prospective students can find you, read
                  reviews, and get in touch.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Globe, text: "Appear in the public directory" },
                    { icon: Users, text: "Receive qualified leads" },
                    { icon: CheckCircle2, text: "Show qualifications and reviews" },
                    { icon: Sparkles, text: "Build trust with verified badge" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleTogglePublic(true)} disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Enable Public Profile"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBenefitsModalOpen(true)}
                  >
                    Learn more
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Learn more modal */}
          <Dialog open={benefitsModalOpen} onOpenChange={setBenefitsModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Get more students with a Public Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  When you enable your public profile, your institution will appear in the Yiba
                  Verified directory. Prospective students can search by province and qualification,
                  read your profile and reviews, and submit enquiries directly to you.
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Your profile appears in search results when students look for accredited institutions.</li>
                  <li>You receive leads with name, email, and message so you can follow up.</li>
                  <li>You can post achievements and updates (verified by Yiba).</li>
                  <li>Reviews from students help build trust and visibility.</li>
                </ol>
                <Button
                  className="w-full"
                  onClick={() => {
                    setBenefitsModalOpen(false);
                    handleTogglePublic(true);
                  }}
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving…" : "Enable Public Profile"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Toggle + Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Public profile</CardTitle>
              <CardDescription>
                When enabled, your institution is listed on the public directory at /institutions
                and has a profile page at /institutions/{profile.slug}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  id="is_public"
                  checked={profile.is_public}
                  onCheckedChange={handleTogglePublic}
                  disabled={savingProfile}
                />
                <Label htmlFor="is_public" className="cursor-pointer">
                  {profile.is_public ? "Public profile is on" : "Public profile is off"}
                </Label>
              </div>
              {profile.is_public && publicUrl && (
                <Button variant="outline" asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    Preview public page <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Edit profile form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>
                Tagline, about, contact visibility, and how applicants can apply.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    name="tagline"
                    defaultValue={profile.tagline ?? ""}
                    placeholder="Short headline for your listing"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    name="about"
                    defaultValue={profile.about ?? ""}
                    rows={4}
                    placeholder="Describe your institution"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_visibility">Contact visibility</Label>
                  <Select
                    name="contact_visibility"
                    defaultValue={profile.contact_visibility ?? "HIDDEN"}
                  >
                    <SelectTrigger id="contact_visibility" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_VISIBILITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="apply_mode">Apply mode</Label>
                  <Select name="apply_mode" defaultValue={profile.apply_mode ?? "INTERNAL"}>
                    <SelectTrigger id="apply_mode" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLY_MODE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="apply_url">Apply URL (required if External or Both)</Label>
                  <Input
                    id="apply_url"
                    name="apply_url"
                    type="url"
                    defaultValue={profile.apply_url ?? ""}
                    placeholder="https://…"
                    className="mt-1"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contact_email">Contact email</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      defaultValue={profile.contact_email ?? ""}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Contact phone</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      defaultValue={profile.contact_phone ?? ""}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      name="logo_url"
                      type="url"
                      defaultValue={profile.logo_url ?? ""}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="banner_url">Banner URL</Label>
                    <Input
                      id="banner_url"
                      name="banner_url"
                      type="url"
                      defaultValue={profile.banner_url ?? ""}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Posts manager */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Posts</CardTitle>
                <CardDescription>
                  Share achievements and updates (max 2 per week). New posts appear as Unverified
                  until reviewed.
                </CardDescription>
              </div>
              <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
                <DialogTrigger asChild>
                  <Button>Create post</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create post</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <div>
                      <Label>Type</Label>
                      <Select name="type" defaultValue="UPDATE">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POST_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="post_title">Title</Label>
                      <Input id="post_title" name="title" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="post_body">Body</Label>
                      <Textarea id="post_body" name="body" rows={4} required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="post_image">Image URL (optional)</Label>
                      <Input id="post_image" name="image_url" type="url" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="post_video">Video URL (optional)</Label>
                      <Input id="post_video" name="video_url" type="url" className="mt-1" />
                    </div>
                    <Button type="submit" disabled={savingPost}>
                      {savingPost ? "Creating…" : "Create post"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <p className="text-sm text-muted-foreground">Loading posts…</p>
              ) : posts.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  description="Create a post to share achievements or updates with prospective students."
                  variant="no-results"
                />
              ) : (
                <ul className="space-y-4">
                  {posts.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.title}</span>
                          <Badge variant={p.type === "ACHIEVEMENT" ? "default" : "secondary"}>
                            {p.type}
                          </Badge>
                          {!p.is_verified && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Unverified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDate(p.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Leads inbox */}
      {canViewLeads && (
        <Card>
          <CardHeader>
            <CardTitle>Leads</CardTitle>
            <CardDescription>
              Enquiries from the public profile. Filter by status or search by name/email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Select
                value={leadStatusFilter}
                onValueChange={(v) => {
                  setLeadStatusFilter(v);
                  setLeadsPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value || "all"} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search name or email…"
                value={leadSearch}
                onChange={(e) => {
                  setLeadSearch(e.target.value);
                  leadSearchRef.current = e.target.value;
                }}
                onKeyDown={(e) => e.key === "Enter" && fetchLeads(1, leadSearch)}
                className="max-w-xs"
              />
              <Button variant="secondary" onClick={() => fetchLeads(1, leadSearch)}>
                Search
              </Button>
            </div>
            {loadingLeads ? (
              <p className="text-sm text-muted-foreground">Loading leads…</p>
            ) : leads.length === 0 ? (
              <EmptyState
                title="No leads found"
                description={
                  leadStatusFilter || leadSearch.trim()
                    ? "Try a different filter or search."
                    : "Leads from your public profile will appear here."
                }
                variant="no-results"
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Date</th>
                        <th className="px-4 py-2 text-left font-medium">Name</th>
                        <th className="px-4 py-2 text-left font-medium">Email</th>
                        <th className="px-4 py-2 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => (
                        <tr key={l.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-2">
                            <Badge
                              variant={
                                l.status === "NEW"
                                  ? "default"
                                  : l.status === "CONTACTED"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {l.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {formatDate(l.created_at)}
                          </td>
                          <td className="px-4 py-2">{l.full_name}</td>
                          <td className="px-4 py-2">{l.email}</td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLeadDetail(l.id)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {leadsTotal > leads.length && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Showing {(leadsPage - 1) * 20 + 1}–{Math.min(leadsPage * 20, leadsTotal)} of{" "}
                      {leadsTotal}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={leadsPage <= 1}
                        onClick={() => fetchLeads(leadsPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={leadsPage * 20 >= leadsTotal}
                        onClick={() => fetchLeads(leadsPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lead detail modal */}
      <Dialog
        open={!!leadViewId}
        onOpenChange={(open) => {
          if (!open) {
            setLeadViewId(null);
            setLeadDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead details</DialogTitle>
          </DialogHeader>
          {leadDetail ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Select
                  value={leadDetail.status}
                  onValueChange={(v) => updateLeadStatus(leadDetail.id, v)}
                  disabled={updatingLeadStatus}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p>
                <span className="text-muted-foreground">Name:</span> {leadDetail.full_name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <a href={`mailto:${leadDetail.email}`} className="text-primary hover:underline">
                  {leadDetail.email}
                </a>
              </p>
              {leadDetail.phone && (
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  <a href={`tel:${leadDetail.phone}`} className="text-primary hover:underline">
                    {leadDetail.phone}
                  </a>
                </p>
              )}
              {leadDetail.location && (
                <p>
                  <span className="text-muted-foreground">Location:</span> {leadDetail.location}
                </p>
              )}
              {leadDetail.qualification_interest && (
                <p>
                  <span className="text-muted-foreground">Qualification interest:</span>{" "}
                  {leadDetail.qualification_interest}
                </p>
              )}
              {leadDetail.highest_education_level && (
                <p>
                  <span className="text-muted-foreground">Education level:</span>{" "}
                  {leadDetail.highest_education_level}
                </p>
              )}
              {leadDetail.message && (
                <p>
                  <span className="text-muted-foreground">Message:</span>
                  <br />
                  <span className="whitespace-pre-wrap">{leadDetail.message}</span>
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Received {formatDate(leadDetail.created_at)}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading…</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
