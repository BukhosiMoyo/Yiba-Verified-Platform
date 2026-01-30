"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProvinceAbbrev, getProvinceBadgeClass } from "@/lib/provinces";
import { Building2, MapPin, Star, ArrowRight, Send } from "lucide-react";
const InstitutionsMapClient = dynamic(
  () => import("./InstitutionsMap").then((m) => m.InstitutionsMap),
  { ssr: false, loading: () => <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground text-sm">Loading map…</div> }
);

export type ListItem = {
  slug: string;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  verification_status: string;
  featured_until: Date | null;
  institution: { legal_name: string; trading_name: string | null; province: string; physical_address: string };
  rating: number | null;
  review_count: number;
  qualification_chips: string[];
  latitude: number | null;
  longitude: number | null;
  distance_km?: number | null;
};

type Props = {
  items: ListItem[];
  total: number;
  page: number;
  limit: number;
  start: number;
  end: number;
  prevHref: string;
  nextHref: string;
};

export function InstitutionsListAndMap({
  items,
  total,
  page,
  limit,
  start,
  end,
  prevHref,
  nextHref,
}: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (selectedSlug && listRef.current) {
      const el = listRef.current.querySelector(`[data-slug="${selectedSlug}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedSlug]);

  const mapItems = items.map((i) => ({
    slug: i.slug,
    latitude: i.latitude,
    longitude: i.longitude,
    institution: i.institution,
  }));

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_400px] lg:gap-6">
      <div className="min-w-0">
        <ul
          ref={listRef}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 list-none p-0 m-0"
          aria-label="Institution listings"
        >
          {items.map((item) => {
            const institutionName = item.institution.trading_name || item.institution.legal_name;
            const isSelected = selectedSlug === item.slug;
            return (
              <li
                key={item.slug}
                data-slug={item.slug}
                className={isSelected ? "ring-2 ring-primary rounded-xl ring-offset-2 ring-offset-background" : undefined}
              >
                <Card
                  className="overflow-hidden transition-shadow hover:shadow-lg border-border/80 rounded-xl cursor-pointer"
                  onClick={() => setSelectedSlug(item.slug)}
                >
                  <div className="relative h-32 bg-muted/50">
                    {item.banner_url ? (
                      <img
                        src={item.banner_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : item.logo_url ? (
                      <div className="h-full flex items-center justify-center p-4 bg-muted/30">
                        <img
                          src={item.logo_url}
                          alt=""
                          className="max-h-20 max-w-full object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/60" aria-hidden />
                      </div>
                    )}
                    {item.banner_url && (
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {item.featured_until && new Date(item.featured_until) >= new Date() && (
                          <Badge variant="default" className="text-xs shadow-sm">Featured</Badge>
                        )}
                        {item.verification_status === "VERIFIED" && (
                          <Badge variant="secondary" className="text-xs shadow-sm">Verified</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start gap-3">
                      {item.logo_url ? (
                        <img
                          src={item.logo_url}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-foreground leading-tight line-clamp-2">
                          {institutionName}
                        </h2>
                        {!item.banner_url && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {item.featured_until && new Date(item.featured_until) >= new Date() && (
                              <Badge variant="default" className="text-xs">Featured</Badge>
                            )}
                            {item.verification_status === "VERIFIED" && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        )}
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {item.institution.province ? (
                            <span
                              className={getProvinceBadgeClass(item.institution.province)}
                              title={item.institution.province}
                              aria-label={item.institution.province}
                            >
                              {getProvinceAbbrev(item.institution.province)}
                            </span>
                          ) : null}
                          {item.institution.physical_address && (
                            <span className="truncate"> · {item.institution.physical_address}</span>
                          )}
                          {item.distance_km != null && (
                            <span className="text-muted-foreground"> · {item.distance_km.toFixed(1)} km</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {item.tagline && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.tagline}</p>
                    )}
                    {item.qualification_chips.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Qualifications
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.qualification_chips.slice(0, 5).map((chip) => (
                            <Badge key={chip} variant="outline" className="text-xs font-normal">
                              {chip}
                            </Badge>
                          ))}
                          {item.qualification_chips.length > 5 && (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                              +{item.qualification_chips.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {(item.rating != null || item.review_count > 0) && (
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{item.rating ?? "—"}</span>
                        <span>({item.review_count} {item.review_count === 1 ? "review" : "reviews"})</span>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex gap-2 pt-0 pb-4">
                    <Button asChild variant="default" className="flex-1" size="sm">
                      <Link href={`/institutions/${item.slug}`} aria-label={`View profile for ${institutionName}`} className="gap-2" onClick={(e) => e.stopPropagation()}>
                        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                        View Profile
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1" size="sm">
                      <Link href={`/institutions/${item.slug}#apply`} aria-label={`Apply to ${institutionName}`} className="gap-2" onClick={(e) => e.stopPropagation()}>
                        <Send className="h-4 w-4 shrink-0" aria-hidden />
                        Apply
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
        {total > limit && (
          <div className="mt-8 flex justify-center gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={prevHref}>Previous</Link>
              </Button>
            )}
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            {page < Math.ceil(total / limit) && (
              <Button asChild variant="outline" size="sm">
                <Link href={nextHref}>Next</Link>
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start h-[400px] lg:h-[min(calc(100vh-5rem),600px)]">
        <InstitutionsMapClient
          items={mapItems}
          selectedSlug={selectedSlug}
          onMarkerClick={setSelectedSlug}
        />
      </div>
    </div>
  );
}
