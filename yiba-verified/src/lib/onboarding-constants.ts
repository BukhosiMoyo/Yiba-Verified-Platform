/**
 * Constants for student onboarding forms
 */

export const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
  { value: "P", label: "Prefer not to say" },
] as const;

export const NATIONALITY_OPTIONS = [
  { value: "ZA", label: "South African" },
  { value: "ZW", label: "Zimbabwean" },
  { value: "MZ", label: "Mozambican" },
  { value: "LS", label: "Lesotho" },
  { value: "BW", label: "Botswana" },
  { value: "NA", label: "Namibia" },
  { value: "SZ", label: "Eswatini" },
  { value: "OTHER", label: "Other" },
] as const;

export const HOME_LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "af", label: "Afrikaans" },
  { value: "zu", label: "Zulu" },
  { value: "xh", label: "Xhosa" },
  { value: "nso", label: "Northern Sotho" },
  { value: "tn", label: "Tswana" },
  { value: "ve", label: "Venda" },
  { value: "ts", label: "Tsonga" },
  { value: "ss", label: "Swati" },
  { value: "nr", label: "Southern Ndebele" },
  { value: "OTHER", label: "Other" },
] as const;

export const ETHNICITY_OPTIONS = [
  { value: "BLACK", label: "Black" },
  { value: "COLOURED", label: "Coloured" },
  { value: "INDIAN", label: "Indian" },
  { value: "WHITE", label: "White" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

export const DISABILITY_STATUS_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

export const NEXT_OF_KIN_RELATIONSHIP_OPTIONS = [
  { value: "PARENT", label: "Parent" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "SIBLING", label: "Sibling" },
  { value: "CHILD", label: "Child" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "OTHER", label: "Other" },
] as const;
