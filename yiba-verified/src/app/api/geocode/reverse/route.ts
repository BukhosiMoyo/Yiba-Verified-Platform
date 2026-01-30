/**
 * GET /api/geocode/reverse?lat=&lon=
 * Reverse geocode lat/lon to a South African province name.
 * Uses OpenStreetMap Nominatim (no API key). Returns { province: string | null }.
 */
import { NextRequest } from "next/server";
import { PROVINCES } from "@/lib/provinces";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

function normalizeProvince(name: string): string | null {
  const lower = name.trim().toLowerCase();
  const match = PROVINCES.find((p) => p.toLowerCase() === lower || p.toLowerCase().replace(/\s/g, "") === lower.replace(/\s/g, ""));
  return match ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const latNum = lat != null ? parseFloat(lat) : NaN;
    const lonNum = lon != null ? parseFloat(lon) : NaN;
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return Response.json({ province: null, error: "Invalid lat or lon" }, { status: 400 });
    }

    const url = `${NOMINATIM_URL}?lat=${latNum}&lon=${lonNum}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "YibaVerified/1.0 (institution directory)" },
    });
    if (!res.ok) {
      return Response.json({ province: null, error: "Geocode service unavailable" }, { status: 502 });
    }
    const data = (await res.json()) as { address?: { state?: string; region?: string; province?: string; country_code?: string }; country_code?: string };
    const country = data.address?.country_code ?? data.country_code;
    if (country?.toUpperCase() !== "ZA") {
      return Response.json({ province: null, error: "Location is not in South Africa" });
    }
    const state = data.address?.state ?? data.address?.region ?? data.address?.province;
    const province = state ? normalizeProvince(state) ?? state : null;
    return Response.json({ province });
  } catch (e) {
    console.error("geocode/reverse error:", e);
    return Response.json({ province: null, error: "Reverse geocode failed" }, { status: 500 });
  }
}
