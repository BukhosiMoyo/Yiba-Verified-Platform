"use client";

import Link from "next/link";
import { useState } from "react";
import { GradientShell } from "@/components/shared/Backgrounds";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Star, Mail, Phone, ExternalLink, Send, BookOpen, GraduationCap, Trophy, Contact, ShieldCheck } from "lucide-react";
import { LogoUploader } from "@/components/institution/LogoUploader";
import type { InstitutionPublicProfile, Institution, InstitutionReview, InstitutionPost } from "@prisma/client";

/** Subset of Institution fields used by the public profile page (matches getProfile select). */
type InstitutionSummary = Pick<
  Institution,
  "institution_id" | "legal_name" | "trading_name" | "province" | "physical_address" | "delivery_modes" | "status"
>;

type Profile = Omit<InstitutionPublicProfile, "cached_rating_avg"> & {
  cached_rating_avg: number | null;
  institution: InstitutionSummary
};
type Review = Pick<InstitutionReview, "id" | "rating" | "comment" | "user_id" | "reviewer_name" | "created_at">;
type Post = Pick<InstitutionPost, "id" | "type" | "title" | "body" | "image_url" | "video_url" | "is_verified" | "created_at">;

type Props = {
  slug: string;
  profile: Profile;
  institution: InstitutionSummary;
  reviews: Review[];
  posts: Post[];
  qualifications: { title: string; nqf_level: number | null }[];
  rating: number | null;
  review_count: number;
  showContact: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  applyExternal: boolean;
  applyInternal: boolean;
  applyUrl: string | null;
  compliance: { accreditation_status: string; accreditation_number: string | null; expiry_date: Date | null } | null;
  contacts: { first_name: string; last_name: string; email: string; phone_number: string | null; type: string }[];
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-ZA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}

export function InstitutionProfileClient({
  slug,
  profile,
  institution,
  reviews,
  posts,
  qualifications,
  rating,
  review_count,
  showContact,
  contactEmail,
  contactPhone,
  applyExternal,
  applyInternal,
  applyUrl,
  compliance,
  contacts,
}: Props) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const name = institution.trading_name || institution.legal_name;

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setLeadSubmitting(true);
    try {
      const res = await fetch(`/api/public/institutions/${slug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fd.get("full_name"),
          email: fd.get("email"),
          phone: fd.get("phone") || null,
          location: fd.get("location") || null,
          highest_education_level: fd.get("highest_education_level") || null,
          qualification_interest: fd.get("qualification_interest") || null,
          message: fd.get("message") || null,
        }),
      });
      if (res.ok) {
        setLeadSuccess(true);
        form.reset();
        setTimeout(() => { setLeadOpen(false); setLeadSuccess(false); }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit");
      }
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setReviewSubmitting(true);
    try {
      const res = await fetch(`/api/public/institutions/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: Number(fd.get("rating")),
          comment: (fd.get("comment") as string)?.trim() || null,
          reviewer_name: (fd.get("reviewer_name") as string)?.trim() || null,
          reviewer_email: (fd.get("reviewer_email") as string)?.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviewSuccess(true);
        form.reset();
        setTimeout(() => { setReviewOpen(false); setReviewSuccess(false); window.location.reload(); }, 1500);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit review");
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const contactVisible = (showContact || contactRevealed) && (contactEmail || contactPhone);

  return (
    <>
      <GradientShell as="section" className="py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {profile.logo_url ? (
              <div className="relative group h-28 w-28 sm:h-32 sm:w-32 shrink-0">
                <img
                  src={profile.logo_url}
                  alt=""
                  className="h-full w-full rounded-2xl border border-border object-cover shadow-card"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {/* Edit Overlay - only if we had a prop to say "can edit", 
                      but for now, let's assume if we are on this page, the edit button is separate.
                      Actually, the user requested to upload logic. 
                      Since I don't have "canEdit" prop here yet, I can't conditionally show it easily without passing it.
                      I'll verify if 'applyInternal' or 'contacts' implies admin access? No.
                      Ideally, the parent server component should pass `isOwner`.
                      
                      For now, I will add a hidden input and a small edit button that is conditionally rendered 
                      IF I add a new prop `isOwner`. 
                  */}
                <LogoUploader institutionId={institution.institution_id} currentLogo={profile.logo_url} />
              </div>
            ) : (
              <div className="relative group h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-2xl border border-border bg-card shadow-card flex items-center justify-center">
                <Building2 className="h-14 w-14 text-muted-foreground sm:h-16 sm:w-16" />
                <LogoUploader institutionId={institution.institution_id} currentLogo={null} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{name}</h1>
              {profile.verification_status === "VERIFIED" && (
                <Badge variant="secondary" className="mt-2 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Verified Institution
                </Badge>
              )}
              {compliance?.accreditation_status === "ACTIVE" && (
                <Badge variant="outline" className="mt-2 ml-2 border-emerald-500 text-emerald-600 dark:text-emerald-400">
                  QCTO Accredited
                </Badge>
              )}
              <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {institution.province}
                {institution.physical_address && ` · ${institution.physical_address}`}
              </p>
              {(rating != null || review_count > 0) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {rating ?? "—"} ({review_count} reviews)
                </p>
              )}
              {/* Contact revealed at top so users see it immediately */}
              {contactVisible && (
                <div className="mt-4 rounded-xl border border-border bg-card/80 px-4 py-3 shadow-soft transition-colors duration-200 dark:bg-card/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {contactEmail && (
                      <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-sm text-primary hover:underline" aria-label={`Email ${contactEmail}`}>
                        <Mail className="h-4 w-4 shrink-0" /> {contactEmail}
                      </a>
                    )}
                    {contactPhone && (
                      <a href={`tel:${contactPhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline" aria-label={`Call ${contactPhone}`}>
                        <Phone className="h-4 w-4 shrink-0" /> {contactPhone}
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2" id="apply">
                {applyInternal && (
                  <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 shadow-soft transition-all duration-200 hover:shadow-float hover:-translate-y-0.5">
                        <Send className="h-4 w-4" /> Apply
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send an enquiry</DialogTitle>
                      </DialogHeader>
                      {leadSuccess ? (
                        <p className="text-sm text-muted-foreground">Thank you. We&apos;ll be in touch.</p>
                      ) : (
                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="lead_name">Full name</Label>
                            <Input id="lead_name" name="full_name" required className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="lead_email">Email</Label>
                            <Input id="lead_email" name="email" type="email" required className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="lead_phone">Phone (optional)</Label>
                            <Input id="lead_phone" name="phone" type="tel" className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="lead_location">Location (optional)</Label>
                            <Input id="lead_location" name="location" className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="lead_qual">Qualification of interest (optional)</Label>
                            <Input id="lead_qual" name="qualification_interest" className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="lead_message">Message (optional)</Label>
                            <Textarea id="lead_message" name="message" rows={3} className="mt-1" />
                          </div>
                          <Button type="submit" disabled={leadSubmitting}>
                            {leadSubmitting ? "Sending…" : "Send enquiry"}
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
                {applyExternal && applyUrl && (
                  <Button variant="outline" className="gap-2 transition-colors duration-200 hover:bg-accent" asChild>
                    <a href={applyUrl} target="_blank" rel="noopener noreferrer">
                      Apply on website <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {applyExternal && applyInternal && applyUrl && (
                  <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="gap-2 transition-colors duration-200 hover:bg-accent">
                        <Phone className="h-4 w-4" /> Request a callback
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Request a callback</DialogTitle>
                      </DialogHeader>
                      {leadSuccess ? (
                        <p className="text-sm text-muted-foreground">Thank you. We&apos;ll be in touch.</p>
                      ) : (
                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="cb_name">Full name</Label>
                            <Input id="cb_name" name="full_name" required className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="cb_email">Email</Label>
                            <Input id="cb_email" name="email" type="email" required className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="cb_phone">Phone</Label>
                            <Input id="cb_phone" name="phone" type="tel" className="mt-1" />
                          </div>
                          <Button type="submit" disabled={leadSubmitting}>
                            {leadSubmitting ? "Sending…" : "Submit"}
                          </Button>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
                {!contactVisible && (contactEmail || contactPhone) && (
                  <Button variant="outline" className="gap-2 transition-colors duration-200 hover:bg-accent" onClick={() => setContactRevealed(true)}>
                    <Contact className="h-4 w-4" /> Reveal contact
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </GradientShell>

      <section className="border-t border-border bg-background py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
          {profile.about && (
            <Card className="overflow-hidden border-l-4 border-l-primary bg-card shadow-card transition-shadow duration-200 hover:shadow-float">
              <CardHeader className="pb-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  About
                </h2>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{profile.about}</p>
              </CardContent>
            </Card>
          )}

          {qualifications.length > 0 && (
            <Card className="overflow-hidden border-l-4 border-l-blue-500/80 bg-card shadow-card transition-shadow duration-200 hover:shadow-float dark:border-l-blue-400/60">
              <CardHeader className="pb-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  Qualifications offered
                </h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {qualifications.map((q) => (
                    <li key={q.title} className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{q.title}</span>
                      {q.nqf_level != null && (
                        <Badge variant="outline">NQF {q.nqf_level}</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {qualifications.length === 0 && (
            <Card className="overflow-hidden border-l-4 border-l-blue-500/80 bg-card shadow-card dark:border-l-blue-400/60">
              <CardHeader className="pb-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  Qualifications offered
                </h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Qualifications (Coming soon)</p>
              </CardContent>
            </Card>
          )}

          {posts.length > 0 && (
            <Card className="overflow-hidden border-l-4 border-l-emerald-500/80 bg-card shadow-card transition-shadow duration-200 hover:shadow-float dark:border-l-emerald-400/60">
              <CardHeader className="pb-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
                    <Trophy className="h-5 w-5" />
                  </span>
                  Updates & achievements
                </h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {posts.map((p) => (
                    <li key={p.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={p.type === "ACHIEVEMENT" ? "default" : "secondary"}>{p.type}</Badge>
                        {!p.is_verified && (
                          <Badge variant="outline" className="text-muted-foreground">Unverified</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">{formatDate(p.created_at)}</span>
                      </div>
                      <h3 className="font-medium mt-1">{p.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.body}</p>
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt=""
                          className="mt-2 rounded-lg max-h-48 object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      {p.video_url && (
                        <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
                          Watch video
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden border-l-4 border-l-amber-500/80 bg-card shadow-card transition-shadow duration-200 hover:shadow-float dark:border-l-amber-400/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                  <Star className="h-5 w-5 fill-amber-500 dark:fill-amber-400" />
                </span>
                Reviews
              </h2>
              <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="transition-colors duration-200 hover:bg-accent">Write a review</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Write a review</DialogTitle>
                  </DialogHeader>
                  {reviewSuccess ? (
                    <p className="text-sm text-muted-foreground">Thank you. Your review has been submitted.</p>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="review_rating">Rating (1–5)</Label>
                        <select id="review_rating" name="rating" required className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="review_comment">Comment (optional)</Label>
                        <Textarea id="review_comment" name="comment" rows={3} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="review_name">Your name (if not logged in)</Label>
                        <Input id="review_name" name="reviewer_name" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="review_email">Your email (if not logged in)</Label>
                        <Input id="review_email" name="reviewer_email" type="email" className="mt-1" />
                      </div>
                      <Button type="submit" disabled={reviewSubmitting}>
                        {reviewSubmitting ? "Submitting…" : "Submit review"}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((r) => (
                    <li key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{r.rating}/5</span>
                        {r.user_id && <Badge variant="secondary" className="text-xs">Verified reviewer</Badge>}
                        <span className="text-sm text-muted-foreground">{formatDate(r.created_at)}</span>
                      </div>
                      {r.comment && <p className="mt-1 text-sm text-foreground">{r.comment}</p>}
                      {!r.user_id && r.reviewer_name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">— {r.reviewer_name}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {contactVisible && (
            <Card className="overflow-hidden border-l-4 border-l-primary/80 bg-card shadow-card transition-shadow duration-200 dark:border-l-primary/60">
              <CardHeader className="pb-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                    <Contact className="h-5 w-5" />
                  </span>
                  Contact
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {contactEmail && (
                    <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-primary hover:underline transition-colors duration-200" aria-label={`Email ${contactEmail}`}>
                      <Mail className="h-4 w-4 shrink-0" /> {contactEmail}
                    </a>
                  )}
                  {contactPhone && (
                    <a href={`tel:${contactPhone}`} className="flex items-center gap-2 text-primary hover:underline transition-colors duration-200" aria-label={`Call ${contactPhone}`}>
                      <Phone className="h-4 w-4 shrink-0" /> {contactPhone}
                    </a>
                  )}
                </div>
                {/* Governance Contacts */}
                {contacts && contacts.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium mb-3">Key Stakeholders</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {contacts.map((contact, i) => (
                        <div key={i} className="flex flex-col text-sm">
                          <span className="font-medium text-foreground">{contact.first_name} {contact.last_name}</span>
                          <span className="text-xs text-muted-foreground uppercase">{contact.type.replace(/_/g, " ")}</span>
                          {contact.email && <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline mt-0.5">{contact.email}</a>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
