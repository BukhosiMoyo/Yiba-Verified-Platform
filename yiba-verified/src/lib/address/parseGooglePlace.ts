/**
 * Structured address parsed from a Google Places API result.
 * Single source of truth for address fields used across the app.
 */
export interface ParsedAddress {
  formatted_address: string;
  street_number: string;
  route: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

/** Minimal shape matching google.maps.places.PlaceResult for parsing (SSR-safe, no global). */
export interface PlaceResultLike {
  formatted_address?: string | null;
  name?: string | null;
  address_components?: Array<{ types: string[]; long_name: string; short_name: string }> | null;
  geometry?: { location?: { lat?: () => number; lng?: () => number } } | null;
}

const SA_PROVINCE_MAP: Record<string, string> = {
  "Eastern Cape": "Eastern Cape",
  "Free State": "Free State",
  Gauteng: "Gauteng",
  "KwaZulu-Natal": "KwaZulu-Natal",
  Limpopo: "Limpopo",
  Mpumalanga: "Mpumalanga",
  "Northern Cape": "Northern Cape",
  "North West": "North West",
  "Western Cape": "Western Cape",
};

function getComponent(
  components: PlaceResultLike["address_components"],
  ...types: string[]
): string {
  if (!components?.length) return "";
  const c = components.find((x) => types.some((t) => x.types.includes(t)));
  return c?.long_name ?? "";
}

function normalizeProvince(name: string): string {
  if (!name) return "";
  if (SA_PROVINCE_MAP[name]) return SA_PROVINCE_MAP[name];
  const found = Object.keys(SA_PROVINCE_MAP).find(
    (p) => p.toLowerCase() === name.toLowerCase()
  );
  return found ? SA_PROVINCE_MAP[found] : name;
}

/**
 * Convert a Google Place result into structured address fields.
 * Use this as the single source of truth for address parsing.
 */
export function parseGooglePlace(place: PlaceResultLike): ParsedAddress {
  const components = place.address_components ?? [];
  const streetNumber = getComponent(components, "street_number");
  const route = getComponent(components, "route");
  const suburb =
    getComponent(components, "sublocality", "sublocality_level_1", "neighborhood") ||
    getComponent(components, "locality");
  const city = getComponent(components, "locality") || suburb || getComponent(components, "administrative_area_level_2");
  const admin1 = getComponent(components, "administrative_area_level_1");
  const province = normalizeProvince(admin1);
  const postalCode = getComponent(components, "postal_code");
  const country = getComponent(components, "country");

  let formatted_address = place.formatted_address ?? "";
  if (!formatted_address && place.name) formatted_address = place.name;
  if (!formatted_address && components.length > 0) {
    formatted_address = components.map((c) => c.long_name).filter(Boolean).join(", ");
  }

  let lat: number | null = null;
  let lng: number | null = null;
  const loc = place.geometry?.location;
  if (loc && typeof loc.lat === "function" && typeof loc.lng === "function") {
    lat = loc.lat();
    lng = loc.lng();
  }

  return {
    formatted_address,
    street_number: streetNumber,
    route,
    suburb,
    city,
    province,
    postal_code: postalCode,
    country,
    lat,
    lng,
  };
}
