/**
 * South African provinces.
 * Used for institution filters, dropdowns, and validation.
 */
export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type Province = (typeof PROVINCES)[number];

/** Abbreviations for display on cards (avoids wrapping). */
export const PROVINCE_ABBREV: Record<Province, string> = {
  "Eastern Cape": "EC",
  "Free State": "FS",
  "Gauteng": "GP",
  "KwaZulu-Natal": "KZN",
  "Limpopo": "LP",
  "Mpumalanga": "MP",
  "Northern Cape": "NC",
  "North West": "NW",
  "Western Cape": "WC",
};

export function getProvinceAbbrev(province: string | null | undefined): string {
  if (!province) return "";
  return PROVINCE_ABBREV[province as Province] ?? province;
}

/** Tailwind classes for province badge/pill (light and dark). One variant per province for distinct colors. */
const PROVINCE_BADGE_CLASSES: Record<Province, string> = {
  "Eastern Cape":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-700",
  "Free State":
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
  Gauteng:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-700",
  "KwaZulu-Natal":
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200 border-violet-200 dark:border-violet-700",
  Limpopo:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 border-rose-200 dark:border-rose-700",
  Mpumalanga:
    "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 border-teal-200 dark:border-teal-700",
  "Northern Cape":
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 border-sky-200 dark:border-sky-700",
  "North West":
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border-orange-200 dark:border-orange-700",
  "Western Cape":
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700",
};

export function getProvinceBadgeClass(province: string | null | undefined): string {
  if (!province) return "";
  const base =
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium";
  const variant = PROVINCE_BADGE_CLASSES[province as Province];
  return variant ? `${base} ${variant}` : `${base} bg-muted text-muted-foreground border-border`;
}
