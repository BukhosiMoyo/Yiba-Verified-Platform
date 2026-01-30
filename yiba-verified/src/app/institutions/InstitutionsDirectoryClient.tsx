"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVINCES } from "@/lib/provinces";
import { Search, MapPin, X, Star } from "lucide-react";

const STORAGE_KEY_DENIED = "yv_institutions_location_denied";
const STORAGE_KEY_USED = "yv_institutions_location_used";
const STORAGE_KEY_LAT = "yv_institutions_user_lat";
const STORAGE_KEY_LON = "yv_institutions_user_lon";

const SORT_LABELS: Record<string, string> = {
  recent: "Recently updated",
  featured: "Featured",
  rating: "Highest rated",
  reviews: "Most reviews",
  near: "Near me",
};

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4", label: "4+ stars" },
  { value: "3", label: "3+ stars" },
];

type Props = {
  initialQ: string;
  initialProvince: string;
  initialSort: string;
  initialRating: string;
  initialPage: number;
  initialLat?: string;
  initialLon?: string;
  total?: number;
  page?: number;
  limit?: number;
};

export function InstitutionsDirectoryClient({
  initialQ,
  initialProvince,
  initialSort,
  initialRating,
  initialPage,
  initialLat = "",
  initialLon = "",
  total = 0,
  page = 1,
  limit = 24,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialProvince) {
      setShowLocationPrompt(false);
      return;
    }
    if (sessionStorage.getItem(STORAGE_KEY_DENIED) || sessionStorage.getItem(STORAGE_KEY_USED)) {
      setShowLocationPrompt(false);
      return;
    }
    setShowLocationPrompt(true);
  }, [initialProvince]);

  const updateParams = useCallback(
    (updates: Record<string, string | number>) => {
      const next = new URLSearchParams(searchParams?.toString() || "");
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === undefined) next.delete(key);
        else next.set(key, String(value));
      });
      router.push(`${pathname}?${next.toString()}`, { scroll: true });
    },
    [pathname, router, searchParams]
  );

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.querySelector('input[name="q"]') as HTMLInputElement)?.value?.trim() || "";
    updateParams({ q, page: 1 });
  };

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by your browser.");
      return;
    }
    setLocationError(null);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `/api/geocode/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
          );
          const data = (await res.json()) as { province?: string | null; error?: string };
          if (data.province && PROVINCES.includes(data.province as (typeof PROVINCES)[number])) {
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem(STORAGE_KEY_USED, "1");
              sessionStorage.setItem(STORAGE_KEY_LAT, String(latitude));
              sessionStorage.setItem(STORAGE_KEY_LON, String(longitude));
            }
            setShowLocationPrompt(false);
            updateParams({ province: data.province, page: 1 });
          } else if (data.error) {
            setLocationError(data.error);
          } else {
            setLocationError("Could not determine province for this location.");
          }
        } catch {
          setLocationError("Could not get location.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationError("Location access denied or unavailable.");
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [updateParams]);

  const handleChooseProvinceManually = useCallback(() => {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(STORAGE_KEY_DENIED, "1");
    setShowLocationPrompt(false);
  }, []);

  const clearFilter = (key: string) => {
    const next = new URLSearchParams(searchParams?.toString() || "");
    next.delete(key);
    if (key === "sort") {
      next.delete("lat");
      next.delete("lon");
    }
    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`, { scroll: true });
  };

  const hasActiveFilters =
    initialProvince || initialRating || (initialSort && initialSort !== "recent") || initialLat || initialLon;

  return (
    <div className="mt-6 space-y-4">
      {showLocationPrompt && (
        <div
          className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm"
          role="region"
          aria-label="Location permission"
        >
          <p className="text-foreground mb-3">
            We&apos;d like to use your location to show institutions near you.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleUseLocation}
              disabled={locationLoading}
              className="gap-2"
              aria-label="Use my location to filter by province"
            >
              <MapPin className="h-4 w-4" />
              {locationLoading ? "Locating…" : "Use my location"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleChooseProvinceManually}
              aria-label="Choose province manually instead"
            >
              Choose province manually
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Search institution, location, or qualification…"
            defaultValue={initialQ}
            className="pl-9"
          />
        </div>
        <Select
          value={initialProvince || "all"}
          onValueChange={(v) => updateParams({ province: v === "all" ? "" : v, page: 1 })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All provinces</SelectItem>
            {PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={initialRating || ""}
          onValueChange={(v) => updateParams({ rating: v, page: 1 })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Min rating" />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((o) => (
              <SelectItem key={o.value || "any"} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={initialSort || "recent"}
          onValueChange={(v) => {
            const updates: Record<string, string | number> = { sort: v, page: 1 };
            if (v === "near" && typeof sessionStorage !== "undefined") {
              const lat = sessionStorage.getItem(STORAGE_KEY_LAT);
              const lon = sessionStorage.getItem(STORAGE_KEY_LON);
              if (lat != null && lon != null) {
                updates.lat = lat;
                updates.lon = lon;
              }
            } else if (v !== "near") {
              updates.lat = "";
              updates.lon = "";
            }
            updateParams(updates);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">{SORT_LABELS.recent}</SelectItem>
            <SelectItem value="featured">{SORT_LABELS.featured}</SelectItem>
            <SelectItem value="near">{SORT_LABELS.near}</SelectItem>
            <SelectItem value="rating">{SORT_LABELS.rating}</SelectItem>
            <SelectItem value="reviews">{SORT_LABELS.reviews}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="default">
          Search
        </Button>
        {initialProvince && (
          <Button
            type="button"
            variant="outline"
            onClick={handleUseLocation}
            disabled={locationLoading}
            className="gap-2"
            aria-label="Refresh location to update province filter"
          >
            <MapPin className="h-4 w-4" />
            {locationLoading ? "Locating…" : "Refresh location"}
          </Button>
        )}
      </form>

      {locationError && (
        <p className="text-sm text-destructive" role="alert">
          {locationError}
        </p>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {initialProvince && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-sm">
              Province: {initialProvince}
              <button
                type="button"
                onClick={() => clearFilter("province")}
                className="rounded p-0.5 hover:bg-muted"
                aria-label={`Clear province filter ${initialProvince}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {initialRating && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {initialRating}+ stars
              <button
                type="button"
                onClick={() => clearFilter("rating")}
                className="rounded p-0.5 hover:bg-muted"
                aria-label="Clear minimum rating filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {initialSort && initialSort !== "recent" && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-sm">
              Sort: {SORT_LABELS[initialSort] ?? initialSort}
              <button
                type="button"
                onClick={() => clearFilter("sort")}
                className="rounded p-0.5 hover:bg-muted"
                aria-label="Clear sort"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              router.push(pathname || "/institutions", { scroll: true });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
