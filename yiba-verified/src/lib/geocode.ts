/**
 * Forward geocode: address string → { lat, lon } using Nominatim (OpenStreetMap).
 * Used for backfilling institution coordinates. Respect Nominatim usage policy (1 req/s).
 */

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

export type GeocodeResult = { lat: number; lon: number };

export async function forwardGeocode(address: string): Promise<GeocodeResult | null> {
  const q = `${address}, South Africa`.trim();
  const url = `${NOMINATIM_SEARCH}?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "YibaVerified/1.0 (institution directory backfill)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const first = data?.[0];
  if (!first?.lat || !first?.lon) return null;
  const lat = parseFloat(first.lat);
  const lon = parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}
