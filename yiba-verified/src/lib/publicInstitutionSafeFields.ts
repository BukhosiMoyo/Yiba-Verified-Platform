/**
 * Safe fields for public institution directory and profile pages.
 * Only expose these + InstitutionPublicProfile; never expose internal emails,
 * staff data, or contact details unless contact_visibility allows (REVEAL_ON_CLICK / PUBLIC).
 */
export const SAFE_INSTITUTION_FIELDS_FOR_PUBLIC = [
  "institution_id",
  "legal_name",
  "trading_name",
  "province",
  "physical_address",
  "delivery_modes",
  "status",
] as const;

export type SafeInstitutionFieldForPublic = (typeof SAFE_INSTITUTION_FIELDS_FOR_PUBLIC)[number];
