export type InstitutionFormEntry = {
  legal_name: string;
  trading_name: string;
  institution_type: string;
  registration_number: string;
  branch_code: string;
  physical_address: string;
  postal_address: string;
  province: string;
  contact_person_name: string;
  contact_email: string;
  contact_number: string;
  offers_workplace_based_learning?: string;
  offers_web_based_learning?: string;
  wbl_summary?: string;
  web_based_lms_name?: string;
};

export const emptyInstitution = (): InstitutionFormEntry => ({
  legal_name: "",
  trading_name: "",
  institution_type: "",
  registration_number: "",
  branch_code: "",
  physical_address: "",
  postal_address: "",
  province: "",
  contact_person_name: "",
  contact_email: "",
  contact_number: "",
  offers_workplace_based_learning: "",
  offers_web_based_learning: "",
  wbl_summary: "",
  web_based_lms_name: "",
});

export type StaffInviteEntry = {
  name: string;
  email: string;
  role: string;
};

export const INSTITUTION_TYPES = [
  { value: "TVET", label: "TVET" },
  { value: "PRIVATE_SDP", label: "Private SDP" },
  { value: "NGO", label: "NGO" },
  { value: "UNIVERSITY", label: "University" },
  { value: "EMPLOYER", label: "Company (accredited for workplace training)" },
  { value: "OTHER", label: "Other" },
] as const;
